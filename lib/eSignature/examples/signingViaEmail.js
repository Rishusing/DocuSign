/**
 * @file
 * @author DocuSign
 */

const fs = require("fs-extra");
const docusign = require("docusign-esign");

const sendEnvelope = async (args) => {

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    results = null;

  let envelope = makeEnvelope(args.envelopeArgs);

  results = await envelopesApi.createEnvelope(args.accountId, {
    envelopeDefinition: envelope,
  });

  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  return { envelopeId: envelopeId };

};

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope
 * @returns {Envelope} An envelope definition
 * @private
 */
function makeEnvelope(args) {
  

  let doc2DocxBytes, doc3PdfBytes;

  doc2DocxBytes = fs.readFileSync(args.doc2File);
  doc3PdfBytes = fs.readFileSync(args.doc3File);

  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Request to signature on the attached document.";

  // add the documents
  let doc1 = new docusign.Document(),
    doc1b64 = Buffer.from(document1(args)).toString("base64"),
    doc2b64 = Buffer.from(doc2DocxBytes).toString("base64"),
    doc3b64 = Buffer.from(doc3PdfBytes).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "I hope this message finds you well. I am writing to request your signature on the attached document. Could you please review the document and sign it where indicated? To make the process as easy as possible, I have attached the document to this email for your convenience. If you have any questions or concerns, please don't hesitate to reach out to me. Thank you for your attention to this matter, and I look forward to receiving the signed document from you."; // can be different from actual file name
  doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
  doc1.documentId = "1"; // a label used to reference the doc

  // Alternate pattern: using constructors for docs 2 and 3...
  let doc2 = new docusign.Document.constructFromObject({
    documentBase64: doc2b64,
    name: "Contract document", // can be different from actual file name
    fileExtension: "docx",
    documentId: "2",
  });

  let doc3 = new docusign.Document.constructFromObject({
    documentBase64: doc3b64,
    name: "Review it", // can be different from actual file name
    fileExtension: "pdf",
    documentId: "3",
  });
  env.documents = [doc1, doc2, doc3];

  let signer1 = docusign.Signer.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    recipientId: "1",
    routingOrder: "1",
  });

  let cc1 = new docusign.CarbonCopy();
  cc1.email = args.ccEmail;
  cc1.name = args.ccName;
  cc1.routingOrder = "2";
  cc1.recipientId = "2";

  let signHere1 = docusign.SignHere.constructFromObject({
      anchorString: "**signature_1**",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    }),
    signHere2 = docusign.SignHere.constructFromObject({
      anchorString: "/sn1/",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "20",
    });
  // Tabs are set per recipient / signer
  let signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1, signHere2],
  });
  signer1.tabs = signer1Tabs;

  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
    carbonCopies: [cc1],
  });
  
  env.recipients = recipients;

  env.status = args.status;

  return env;
}

/**
 * Creates document 1
 * @function
 * @private
 * @param {Object} args parameters for the envelope
 * @returns {string} A document in HTML format
 */

function document1(args) {
  
  return `
    <!DOCTYPE html>
    <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family:sans-serif;margin-left:2em;">
        <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
        <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
          color: darkblue;">Order Processing Division</h2>
        <h4>Ordered by ${args.signerName}</h4>
        <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
        <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
        <p style="margin-top:3em;">
  Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
        </p>
        <!-- Note the anchor tag for the signature field is in white. -->
        <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
        </body>
    </html>
  `;
}

module.exports = { sendEnvelope, makeEnvelope, document1 };
