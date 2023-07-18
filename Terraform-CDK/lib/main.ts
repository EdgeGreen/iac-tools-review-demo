import { TerraformStack, TerraformOutput } from "cdktf";
import { Construct } from "constructs";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { IamUser } from "@cdktf/provider-aws/lib/iam-user";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamPolicyAttachment } from "@cdktf/provider-aws/lib/iam-policy-attachment";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

import { Vpc } from "../.gen/modules/terraform-aws-modules/aws/vpc";

export class TerraformCDKStack extends TerraformStack {
  user: IamUser
  vpc: Vpc

  constructor(scope: Construct, id: string, region = "eu-central-1") {
    super(scope, id);

    new AwsProvider(this, "aws", {
      region,
    });

    // Create USER
    this.user = new IamUser(this, "User", {
      name: "CDKtf-TypeScript-User-Demo",
    });

    // Create VPC
    const allAvailabilityZones =
    new DataAwsAvailabilityZones(
      this,
      "all-availability-zones",
      {}
    ).names;

    this.vpc = new Vpc(this, "demo-vpc", {
      name: "demo-vpc",
      cidr: "10.0.0.0/16",
      azs: allAvailabilityZones,
      publicSubnets: ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"],
      enableDnsHostnames: true,
    });

    this.grantS3Permissions();
    this.grantDynamoPermissions ();
    this.grantLambdaPermissions();
    this.grantStepFunctionPermissions();
    this.grantSQSPermissions();
    this.grantSNSPermissions();
    this.showOutputs ();
  }

  private grantS3Permissions(): void {  
    const s3Permission = new IamPolicy(this, "s3Permission", {
      name: "s3Permission",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:PutObjectTagging', 's3:DeleteObject'],
            Resource: [`arn:aws:s3:::*`],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add s3 permissions",
    });

    new IamPolicyAttachment(
      this,
      "s3PermissionPolicy",
      {
        name: "s3-Permission-attachment",
        policyArn: s3Permission.arn,
        users: [this.user.name],
      }
    );
  }

  private grantDynamoPermissions(): void {  
    const dynamoListTablePolicy = new IamPolicy(this, "dynamoListTablePolicy", {
      name: "DynamoList",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["dynamodb:ListTables"],
            Resource: ["arn:aws:dynamodb:*:433349744699:table/*"],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add DynamoDB list permissions",
    });

    const dynamoPermission = new IamPolicy(this, "dynamoPermission", {
      name: "DynamoPermissions",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:DescribeTable',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ],
            Resource: ["arn:aws:dynamodb:*:433349744699:table/*"],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add DynamoDB permissions",
    });

    new IamPolicyAttachment(
      this,
      "DynamoList",
      {
        name: "dynamo-ListTable-attachment",
        policyArn: dynamoListTablePolicy.arn,
        users: [this.user.name],
      }
    );

    new IamPolicyAttachment(
      this,
      "DynamoPermissions",
      {
        name: "dynamo-Permission-attachment",
        policyArn: dynamoPermission.arn,
        users: [this.user.name],
      }
    );
  }
  
  private grantLambdaPermissions(): void {  
    const lambdaPermission = new IamPolicy(this, "lambdaPermission", {
      name: "lambdaPermission",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: ['lambda:InvokeFunction', 'lambda:GetFunctionConfiguration'],
            Resource: ["arn:aws:lambda:*:433349744699:function:*"],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add Lambda permissions",
    });

    new IamPolicyAttachment(
      this,
      "lambdaPermissionPolicy",
      {
        name: "lambda-Permission-attachment",
        policyArn: lambdaPermission.arn,
        users: [this.user.name],
      }
    );
  }
  
  private grantSQSPermissions(): void {  
    const sqsPermission = new IamPolicy(this, "sqsPermission", {
      name: "sqsPermission",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              'sqs:SendMessage',
              'sqs:GetQueueAttributes',
              'sqs:GetQueueUrl',
              'sqs:ReceiveMessage',
              'sqs:ChangeMessageVisibility',
              'sqs:DeleteMessage',
              'sqs:CreateQueue',
            ],
            Resource: ["arn:aws:sqs:*:433349744699:*"],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add sqs permissions",
    });

    new IamPolicyAttachment(
      this,
      "sqsPermissionPolicy",
      {
        name: "sqs-Permission-attachment",
        policyArn: sqsPermission.arn,
        users: [this.user.name],
      }
    );
  }

  private grantSNSPermissions(): void {  
    const snsPermission = new IamPolicy(this, "snsPermission", {
      name: "snsPermission",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: ['SNS:Publish'],
            Resource: [`arn:aws:sns:*:433349744699:*`],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add sns permissions",
    });

    new IamPolicyAttachment(
      this,
      "snsPermissionPolicy",
      {
        name: "sns-Permission-attachment",
        policyArn: snsPermission.arn,
        users: [this.user.name],
      }
    );
  }

  private grantStepFunctionPermissions(): void {  
    const stepFunctionPermission = new IamPolicy(this, "stepFunctionPermission", {
      name: "stepFunctionPermission",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              'states:StartExecution',
              'states:StopExecution',
              'states:DescribeStateMachine',
              'states:ListExecutions',
              'states:GetExecutionHistory',
              'states:DescribeExecution',
            ],
            Resource: [
              `arn:aws:states:*:433349744699:stateMachine:*`,
              `arn:aws:states:*:433349744699:execution:*`,
              `arn:aws:states:*:433349744699:activity:*`,
            ],
            Effect: "Allow",
          },
        ],
      }),
      description: "This policy add step function permissions",
    });

    new IamPolicyAttachment(
      this,
      "stepFunctionPermissionPolicy",
      {
        name: "step-Function-Permission-attachment",
        policyArn: stepFunctionPermission.arn,
        users: [this.user.name],
      }
    );
  }

  private showOutputs(): void {  
    new TerraformOutput(this, "iam_username", {
      value: this.user.arn,
    });

    new TerraformOutput(this, "vpc_cidr", {
      value: this.vpc.cidr
    });

    new TerraformOutput(this, "vpc_azs", {
      value: this.vpc.azs
    });

    new TerraformOutput(this, "vpc_public", {
      value: this.vpc.publicSubnets
    });
  }  
}


