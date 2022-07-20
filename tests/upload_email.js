const fs = require('fs');
const AWS = require('aws-sdk');

var nodemailer = require('nodemailer');

// Enter copied or downloaded access ID and secret key here
const ID = '';
const SECRET = '';

// The name of the bucket that you have created
const BUCKET_NAME = 'apim-4.1.0-ui-testing';
var secretAccessKey = process.env.S3_SECRET_KEY;
var accessKeyId = process.env.S3_ACCESS_KEY;
var testGridEmailPWD = process.env.TESTGRID_EMAIL_PASSWORD;


const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey
});

const uploadFile = (fileName) => {
  // Read content from the file
  const fileContent = fs.readFileSync(fileName);

  var timestamp = new Date() / 1000;
  // Setting up S3 upload parameters
  const params = {
      Bucket: BUCKET_NAME,
      Key: 'mochawesome-bundle-' + timestamp + '.html', // File name you want to save as in S3
      Body: fileContent,
      ACL: 'public-read',
      ContentType : "text/html"
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
      if (err) {
          // throw err;
          console.log(`File uploaded Error to AWS s3 bucket.`);
      }
      console.log(`File uploaded successfully. ${data.Location}`);

      var content = `Click on ${data.Location} to view the complete test report`;
      var transporter = nodemailer.createTransport({
        host: 'tygra.wso2.com',
        port: '2587',
        auth: {
          user: 'testgrid',
          pass: testGridEmailPWD
        }
      });

      var mailOptions = {
          from: "TestGrid Team <testgrid@wso2.com>",
          to: "prasanna@wso2.com,vimukthi@wso2.com,rosens@wso2.com,nandika@wso2.com,dhanushka@wso2.com,bathiya@wso2.com",
          subject: `WSO2 APIM 4.1.0 UI TESTS`,
          html: content
      }


      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
  });
};
uploadFile('./cypress/reports/html/mochawesome-bundle.html');