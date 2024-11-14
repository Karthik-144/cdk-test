import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as CdkTest from '../lib/cdk-test-stack';

test('GraphQL API Created', () => {
  const app = new cdk.App();
  const stack = new CdkTest.CdkTestStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::AppSync::GraphQLApi', {
    Name: 'cdk-test-api',
    AuthenticationType: 'API_KEY',
  });
});

test('DynamoDB Table Created', () => {
  const app = new cdk.App();
  const stack = new CdkTest.CdkTestStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'BooksTable',
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH',
      },
    ],
  });
});

test('Lambda Function Created', () => {
  const app = new cdk.App();
  const stack = new CdkTest.CdkTestStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    FunctionName: 'cdk-test-lambda',
    Runtime: 'nodejs18.x',
  });
});

test('Resolvers Created for GraphQL API', () => {
  const app = new cdk.App();
  const stack = new CdkTest.CdkTestStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  // Test for getAllBooks resolver
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    ApiId: { Ref: 'Api' },
    TypeName: 'Query',
    FieldName: 'getBooks',
  });

  // Test for createBook resolver
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    ApiId: { Ref: 'Api' },
    TypeName: 'Mutation',
    FieldName: 'addBook',
  });

  // Test for deleteBook resolver
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    ApiId: { Ref: 'Api' },
    TypeName: 'Mutation',
    FieldName: 'deleteBook',
  });

  // Test for updateBook resolver
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    ApiId: { Ref: 'Api' },
    TypeName: 'Mutation',
    FieldName: 'updateBook',
  });

  // Test for getBookById resolver
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    ApiId: { Ref: 'Api' },
    TypeName: 'Query',
    FieldName: 'getBookById',
  });

  // Test for getBooksByAuthor resolver
  template.hasResourceProperties('AWS::AppSync::Resolver', {
    ApiId: { Ref: 'Api' },
    TypeName: 'Query',
    FieldName: 'getBooksByAuthor',
  });
});