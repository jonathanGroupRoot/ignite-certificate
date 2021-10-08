import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "src/utils/dynamodb-client";

export const handle: APIGatewayProxyHandler = async (event: any) => {
  const { id } = event.pathParameters;

  const response = await document.query({
    TableName: "users_certificates",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id
    }
  }).promise();

  const userCertificate = response.Items[0];

  if(userCertificate) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Valid Certificate!",
        name: userCertificate.name,
        url_certificate: `https://ignite-certificate-bucket.s3.amazonaws.com/${id}.pdf` 
      })
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid Certificate!",
      })
    }
  }
}