import * as acm from "@aws-sdk/client-acm";

// required by cloudfront for certificates
const REGION = "us-east-1";

export async function requestCertificate(domainName: string): Promise<string> {
  const acmClient = new acm.ACMClient({ region: REGION });

  const requestCertCommand = new acm.RequestCertificateCommand({
    DomainName: domainName,
    ValidationMethod: "DNS",
  });

  const response = await acmClient.send(requestCertCommand);

  if (!response.CertificateArn) {
    throw new Error("Failed to request certificate");
  }

  return response.CertificateArn;
}

export async function deleteCertificate(certArn: string): Promise<void> {
  {
    const acmClient = new acm.ACMClient({ region: REGION });

    const deleteCertCommand = new acm.DeleteCertificateCommand({
      CertificateArn: certArn,
    });

    await acmClient.send(deleteCertCommand);
  }
}

type ValidationDetails = acm.DomainValidation & {
  ResourceRecord: acm.ResourceRecord & {
    Type: string;
    Name: string;
    Value: string;
  };
  ValidationStatus: string;
};

export async function getCertificateDomainValidation(
  certArn: string
): Promise<ValidationDetails> {
  const acmClient = new acm.ACMClient({ region: REGION });

  const describeCertCommand = new acm.DescribeCertificateCommand({
    CertificateArn: certArn,
  });

  let certDetails: acm.DescribeCertificateCommandOutput | undefined;
  // ACM can take a few seconds to generate the DNS validation options
  // so we poll until we get them
  for (let i = 0; i < 10; i++) {
    certDetails = await acmClient.send(describeCertCommand);

    const validation = certDetails.Certificate?.DomainValidationOptions?.[0];

    if (
      validation?.ValidationStatus &&
      validation.ResourceRecord &&
      validation.ResourceRecord.Type &&
      validation.ResourceRecord.Name &&
      validation.ResourceRecord.Value
    ) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const domainValidation =
    certDetails?.Certificate?.DomainValidationOptions?.[0];

  if (
    !domainValidation?.ValidationStatus ||
    !domainValidation.ResourceRecord ||
    !domainValidation.ResourceRecord.Type ||
    !domainValidation.ResourceRecord.Name ||
    !domainValidation.ResourceRecord.Value
  ) {
    throw new Error("Failed to get domain validation options for certificate");
  }

  return {
    ...domainValidation,
    ResourceRecord: {
      Type: domainValidation.ResourceRecord.Type,
      Name: domainValidation.ResourceRecord.Name,
      Value: domainValidation.ResourceRecord.Value,
    },
    ValidationStatus: domainValidation.ValidationStatus,
  };
}
