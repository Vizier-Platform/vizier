import { deployAppServer } from "../src/lib/aws/cdk-app-server";

deployAppServer({
  isImageLocal: false,
  imagePath: "nginxdemos/hello",
  containerPort: 80,
});
