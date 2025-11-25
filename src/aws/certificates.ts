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

export async function getCertificateDomainValidation(
  certArn: string
): Promise<acm.DomainValidation> {
  const acmClient = new acm.ACMClient({ region: REGION });

  const describeCertCommand = new acm.DescribeCertificateCommand({
    CertificateArn: certArn,
  });

  let certDetails: acm.DescribeCertificateCommandOutput | undefined;
  // ACM can take a few seconds to generate the DNS validation options
  // so we poll until we get them
  for (let i = 0; i < 10; i++) {
    certDetails = await acmClient.send(describeCertCommand);

    const options = certDetails.Certificate?.DomainValidationOptions || [];

    if (options[0] && options[0].ResourceRecord) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const domainValidation =
    certDetails?.Certificate?.DomainValidationOptions?.[0];

  if (!domainValidation?.ResourceRecord) {
    throw new Error("Failed to get domain validation options for certificate");
  }

  return domainValidation;
}
