import puppeteer from "puppeteer";

export const generatePDFBuffer = async (
  htmlContent: string
): Promise<Buffer> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "a4" });
  await browser.close();
  return pdfBuffer;
};

export const generatePDFBufferFromHTML = async (
  html: string,
  options: { watermarkText?: string } = {}
): Promise<Buffer> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  if (options.watermarkText) {
    await page.addStyleTag({
      content: `
        body::after {
          content: '${options.watermarkText}';
          position: fixed;
          top: 45%;
          left: 25%;
          opacity: 0.2;
          font-size: 5rem;
          transform: rotate(-30deg);
          color: #000;
          z-index: 9999;
        }
      `,
    });
  }

  const pdfBuffer = await page.pdf({ format: "a4" });
  await browser.close();
  return pdfBuffer;
};
