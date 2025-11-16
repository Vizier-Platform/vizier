import { deployAppServer } from "../src/lib/aws/cdk-app-server";

deployAppServer({
  isImageLocal: true,
  imagePath: "/home/nathan/dev-launch/capstone/prep/vps/simple-express",
  containerPort: 3000,
});
