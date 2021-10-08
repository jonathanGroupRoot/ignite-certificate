import chrome from "chrome-aws-lambda";
import { document } from "src/utils/dynamodb-client"
import handlebars from "handlebars";
import dayjs from "dayjs";
import path from "path";
import fs from "fs";
import AWS from "aws-sdk";

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
  const template = {
    id,
    name,
    date,
    medal,
    grade,
  };

  const content = await compile(template);

  const browser = await chrome.puppeteer.launch({
    headless: true,
    args: chrome.args,
    defaultViewport: chrome.defaultViewport,
    executablePath: await chrome.executablePath
  });

  const page = (await browser.pages())[0];

  await page.setContent(content);

  const pdf = await page.pdf({
    format: "a4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  const s3 = new AWS.S3();

  await s3.putObject({
    Bucket: "ignite-certificate-bucket",
    Key: `${id}.pdf`,
    ACL: "public-read",
    Body: pdf,
    ContentType: "application/pdf"
  }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify(
      { 
        message: 'Certificate was created!',
        url_certificate: `https://ignite-certificate-bucket.s3.amazonaws.com/${id}.pdf` 
      }
    ),
    headers: {
      'Content-Type': 'application/json'
    }
  }
}