// import chromium from "chrome-aws-lambda";
import { document } from "src/utils/dynamodb-client"
import * as handlebars from "handlebars";
import * as dayjs from "dayjs";
import * as path from "path";
import * as fs from "fs";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  date: string;
  grade: string;
  medal: string;
}

const compile = async (data: ITemplate) => {
  const filePath = path.join(process.cwd(), "src", "templates", "certificate.hbs");

  const html = fs.readFileSync(filePath, "utf-8");

  return handlebars.compile(html)(data);
}

export const handle = async (event: any) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

  await document.put({
    TableName: 'users_certificates',
    Item: {
      id,
      name,
      grade,
    }
  }).promise();

  const medalPath = path.join(process.cwd(), "src", "templates", "selo.png");
  const medal = fs.readFileSync(medalPath, "base64");
  const date = dayjs().format("DD/MM/YYYY");

  await compile({
    id,
    name,
    date,
    medal,
    grade,
  });

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Certificate was created!' }),
    headers: {
      'Content-Type': 'application/json'
    }
  }
}