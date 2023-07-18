import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { Vpc, SubnetType} from 'aws-cdk-lib/aws-ec2';
import { CfnUser, Effect, PolicyStatement, PolicyDocument, ManagedPolicy, User } from 'aws-cdk-lib/aws-iam';

export class AwsCdkStack extends Stack {
  user: User;
  vpc: Vpc

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.user = new User(this, 'TestCDKUser', {
      userName: `${this.stackName}-user`,
    });
    (this.user.node.defaultChild as CfnUser).overrideLogicalId('TestCDKUser');

    this.vpc = new Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      // enableDnsHostnames: true,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'public-subnet-2',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'public-subnet-3',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });
    this.grantS3Permissions();
    this.grantDynamoPermissions();
    this.grantLambdaPermissions();
    this.grantStepFunctionPermissions();
    this.grantSQSPermissions();
    this.grantSNSPermissions();
    this.Outputs();
  }
  
  private grantS3Permissions(): void {
    const s3Permission = new PolicyStatement({
      actions: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:PutObjectTagging', 's3:DeleteObject'],
      resources: [`arn:aws:s3:::*`],
      effect: Effect.ALLOW,
    });

    this.user.addToPolicy(s3Permission);
  }

  private grantDynamoPermissions(): void {
    const dynamoListTablePolicy = new PolicyStatement({
      actions: ['dynamodb:ListTables'],
      resources: [`arn:aws:dynamodb:*:${this.account}:table/*`],
      effect: Effect.ALLOW,
    });
    this.user.addToPolicy(dynamoListTablePolicy);

    const dynamoPermission = new PolicyStatement({
      actions: [
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:DescribeTable',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
      ],
      resources: [`arn:aws:dynamodb:*:${this.account}:table/*`],
      effect: Effect.ALLOW,
    });

    this.user.addToPolicy(dynamoPermission);
  }

  private grantLambdaPermissions(): void {
    const lambdaPermission = new PolicyStatement({
      actions: ['lambda:InvokeFunction', 'lambda:GetFunctionConfiguration'],
      resources: [
        `arn:aws:lambda:*:${this.account}:function:*`
      ],
      effect: Effect.ALLOW,
    });

    this.user.addToPolicy(lambdaPermission);
  }

  private grantSQSPermissions(): void {
    const sqsPermission = new PolicyStatement({
      resources: [`arn:aws:sqs:*:${this.account}:*`],
      actions: [
        'sqs:SendMessage',
        'sqs:GetQueueAttributes',
        'sqs:GetQueueUrl',
        'sqs:ReceiveMessage',
        'sqs:ChangeMessageVisibility',
        'sqs:DeleteMessage',
        'sqs:CreateQueue',
      ],
      effect: Effect.ALLOW,
    });

    this.user.addToPolicy(sqsPermission);
  }

  private grantSNSPermissions(): void {
    const snsPermission = new PolicyStatement({
      actions: ['SNS:Publish'],
      resources: [`arn:aws:sns:*:${this.account}:*`],
      effect: Effect.ALLOW,
    });

    this.user.addToPolicy(snsPermission);
  }

  private grantStepFunctionPermissions(): void {
    const stepFunctionPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          resources: [
            `arn:aws:states:*:${this.account}:stateMachine:*`,
            `arn:aws:states:*:${this.account}:execution:*`,
            `arn:aws:states:*:${this.account}:activity:*`,
          ],
          actions: [
            'states:StartExecution',
            'states:StopExecution',
            'states:DescribeStateMachine',
            'states:ListExecutions',
            'states:GetExecutionHistory',
            'states:DescribeExecution',
          ],
          effect: Effect.ALLOW,
        }),
      ],
    });

    const stepFunctionManagedPolicy = new ManagedPolicy(this, 'stepFnPolicy', {
      document: stepFunctionPolicy,
    });

    stepFunctionManagedPolicy.attachToUser(this.user);
  }

  private Outputs(): void {
    new CfnOutput(this, 'userArn', {
      value: this.user.userArn,
      description: 'The arn of the user',
      exportName: 'demo-user',
    });

    new CfnOutput(this, 'vpcID', {
      value: this.vpc.vpcId,
      description: 'The ID of the vpc',
      exportName: 'demo-vpc',
    });
  }
}
