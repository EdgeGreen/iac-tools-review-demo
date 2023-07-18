import { App, S3Backend } from "cdktf";
import { TerraformCDKStack } from '../lib/main';

const app = new App();

const stack = new TerraformCDKStack(app, "Terraform-CDK");

new S3Backend(stack, {
    bucket: "edge-global-terraform-state-bucket",
    key: "tf-backend/tf-cdk/terraform.tfstate",
    region: "eu-central-1",
    dynamodbTable: "edge-global-terraform-state-table",
    encrypt: true
  });

app.synth();