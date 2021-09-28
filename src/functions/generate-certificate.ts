import { document } from "src/utils/dynamodb-client"

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

export const handle = async (event: any) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

  await document.put({
    TableName: 'users_certificates',
    Item: {
      id,
      name, 
      grade
    }
  }).promise();  

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Certificate was created!' }),
    headers: {
      'Content-Type':'application/json'
    }
  }
}