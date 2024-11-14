import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as appsync from "aws-cdk-lib/aws-appsync";

export class CdkTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkTestQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'cdk-test-api',
      schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        }
      },
      xrayEnabled: true

    });
    // create table using the api
    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });
    const dataSource = api.addDynamoDbDataSource('books', booksTable);

    // booksTable.grantFullAccess(dataSource);

    dataSource.createResolver("getAllBooks", {
      typeName: "Query",
      fieldName: "getBooks",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });
    dataSource.createResolver("createBook", {
      typeName: "Mutation",
      fieldName: "addBook",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(appsync.PrimaryKey.partition('id').auto(), appsync.Values.projecting()),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
    dataSource.createResolver("deleteBook", {
      typeName: "Mutation",
      fieldName: "deleteBook",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem('id', 'id'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
    dataSource.createResolver('UpdateBookResolver', {
      typeName: "Mutation",
      fieldName: "updateBook",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key": {
            "id": { "S": "$ctx.args.id" }
          },
          "update": {
            "expression": "set #title = :title, #author = :author",
            "expressionNames": {
              "#title": "title",
              "#author": "author"
            },
            "expressionValues": {
              ":title": { "S": "$ctx.args.title" },
              ":author": { "S": "$ctx.args.author" }
            }
          },
          "condition": {
            "expression": "attribute_exists(id)"
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
    // getbook by id
    dataSource.createResolver('getBookById', {
      typeName: "Query",
      fieldName: "getBookById",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('id', 'id'),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    // create lambda function
    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      functionName: 'cdk-test-lambda',
      handler: 'main.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        DYNAMODB_TABLE_NAME: booksTable.tableName,
      }
    });
    // grant permission to lambda to access dynamodb
    booksTable.grantReadWriteData(lambdaFunction);
    // create a new resolver for lambda
    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', lambdaFunction);
    lambdaDs.createResolver('getBooksByAuthor',{
      typeName: "Query",
      fieldName: "getBooksByAuthor",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
    });

    new cdk.CfnOutput(this, 'Stack Region', {
      value: this.region,
    });

  }

}
