export const generatePayslipHTML = (data: {
  name: string;
  role: string;
  month: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  paymentDate?: Date;
  status?: string;
  companyName?: string;
}) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          td, th { padding: 10px; border: 1px solid #ccc; text-align: left; }
        </style>
      </head>
      <body>
        <h1 style="margin-bottom: 8px;">${data.companyName}</h1>
        <p style="text-align: center; font-size: 0.9rem;">Salary Payslip for ${
          data.month
        }</p>
        <hr />
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Role:</strong> ${data.role}</p>
        <table>
          <tr><th>Base Salary</th><td>₹${data.baseSalary.toFixed(2)}</td></tr>
          <tr><th>Bonuses</th><td>₹${data.bonuses.toFixed(2)}</td></tr>
          <tr><th>Deductions</th><td>₹${data.deductions.toFixed(2)}</td></tr>
          <tr><th>Net Pay</th><td><strong>₹${data.netPay.toFixed(
            2
          )}</strong></td></tr>
          <tr><th>Status</th><td>${data.status}</td></tr>
          <tr><th>Payment Date</th><td>${
            data.paymentDate ? new Date(data.paymentDate).toDateString() : "-"
          }</td></tr>
          <tr><th>Payment Date</th><td>${
            data.paymentDate?.toLocaleDateString() || "N/A"
          }</td></tr>
        </table>
        <p style="margin-top: 32px">Generated on: ${new Date().toDateString()}</p>
      </body>
    </html>
  `;
};
