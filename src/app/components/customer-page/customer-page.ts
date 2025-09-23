import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { map, Observable } from 'rxjs';
import { Customer } from '../../../type';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-page',
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.css',
  imports: [FormsModule],
})
export class CustomerComponent implements OnInit {
  customers$!: Observable<Customer[]>;
  loading: boolean = false;
  customer$: Customer[] = [];

  selectedCustomer?: Customer;
  totalAmount: number = 0;

  newCustomer: Partial<Customer> = {
    name: '',
    email: '',
    address: '',
    phone_number: '',
    amount: 0,
  };
  editCustomerModel: Partial<Customer> = {};

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;

    this.customers$ = this.customerService.getCustomers().pipe(
      map((customers: any[]) => {
        this.totalAmount = customers.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        return [...customers].sort((a, b) => a.id - b.id);
      })
    );
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customer$ = data.sort((a, b) => a.id - b.id);
        this.totalAmount = this.customer$.reduce(
          (sum, customer) => sum + Number(customer.amount || 0),
          0
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching customers:', err);
        this.loading = false;
      },
    });
  }

  addCustomer() {
    const payload = { ...this.newCustomer };
    if (!payload.name) return alert('Name required');
    if (!payload.email) return alert('Email required');
    if (!payload.phone_number) return alert('Phone Number required');
    if (!payload.amount) return alert('Amount Number required');
    if (!payload.address) return alert('Address required');

    this.customerService.createCustomer(payload).subscribe({
      next: () => {
        this.newCustomer = { name: '', email: '', address: '', phone_number: '', amount: 0 };
        this.loadCustomers();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to add customer');
      },
    });
  }

  openEdit(c: Customer) {
    this.editCustomerModel = { ...c };
  }

  updateCustomer() {
    if (!this.editCustomerModel.id) return;
    const id = this.editCustomerModel.id;
    this.customerService.updateCustomer(id, this.editCustomerModel).subscribe({
      next: () => this.loadCustomers(),
      error: (err) => {
        console.error(err);
        alert('Failed to update customer');
      },
    });
  }

  openInfo(c: Customer) {
    this.selectedCustomer = c;
  }
  deleteCustomer(id: number) {
    if (!confirm('Are you sure to delete this customer?')) return;
    this.customerService.deleteCustomer(id).subscribe({
      next: () => this.loadCustomers(),
      error: (err) => {
        console.error(err);
        alert('Failed to delete customer');
      },
    });
  }

  exportCustomerPDF(customer: Customer) {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let startY = 80;
    const lineHeight = 28;

    //  Header Background
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', pageWidth / 2, 45, { align: 'center' });

    //  Info Card
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, startY - 20, pageWidth - 2 * margin, 350, 10, 10, 'FD');

    // Labels & Data
    const labels = [
      { key: 'ID', value: customer.id.toString() },
      { key: 'Name', value: customer.name },
      { key: 'Email', value: customer.email },
      { key: 'Phone', value: customer.phone_number },
      { key: 'Amount', value: customer.amount.toString() },
    ];

    let y = startY;
    labels.forEach((item) => {
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.key}:`, margin + 20, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(item.value || '', margin + 120, y);

      y += lineHeight;
    });

    // Address Section
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('Address:', margin + 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const addressLines = doc.splitTextToSize(customer.address, pageWidth - margin * 2 - 100);
    doc.text(addressLines, margin + 120, y);

    y += lineHeight + (addressLines.length - 1) * 14;

    //  Created At
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('Created At:', margin + 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(customer.created_at || '', margin + 120, y);

    //  Bottom Separator
    const bottomY = y + 40;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, bottomY, pageWidth - margin, bottomY);

    //  Footer
    doc.setFontSize(10);
    doc.setTextColor(150);

    // Save PDF
    doc.save(`customer_${customer.id}.pdf`);
  }

  exportAllCustomersPDF() {
    this.customers$.subscribe((customers) => {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let startY = 60;
      const rowHeight = 45;

      // Column positions & widths
      const col = {
        id: { x: margin, width: 30 },
        name: { x: margin + 40, width: 120 },
        email: { x: margin + 170, width: 130 },
        phone: { x: margin + 310, width: 80 },
        amount: { x: margin + 400, width: 60 },
      };

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('All Customers', pageWidth / 2, 30, { align: 'center' });

      // Header
      doc.setFontSize(12);
      doc.setFillColor(50, 50, 50);
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, startY - rowHeight + 5, pageWidth - 2 * margin, rowHeight, 'F');

      doc.text('ID', col.id.x, startY);
      doc.text('Name', col.name.x, startY);
      doc.text('Email', col.email.x, startY);
      doc.text('Phone', col.phone.x, startY);
      doc.text('Amount', col.amount.x, startY);

      startY += rowHeight;
      doc.setTextColor(0, 0, 0);

      // Table Body with wrap
      customers.forEach((c, index) => {
        if (startY > 750) {
          doc.addPage();
          startY = 60;
        }

        // Zebra stripe
        if (index % 2 === 0) {
          doc.setFillColor(230, 230, 230);
          doc.rect(margin, startY - 18, pageWidth - 2 * margin, rowHeight, 'F');
        }

        // Auto-wrap text
        doc.text(c.id.toString(), col.id.x, startY);
        doc.text(doc.splitTextToSize(c.name, col.name.width), col.name.x, startY);
        doc.text(doc.splitTextToSize(c.email, col.email.width), col.email.x, startY);
        doc.text(doc.splitTextToSize(c.phone_number, col.phone.width), col.phone.x, startY);
        doc.text(c.amount.toString(), col.amount.x, startY);

        startY += rowHeight;
      });

      // Total Amount
      const totalAmount = customers.reduce((sum, c) => sum + Number(c.amount), 0);

      if (startY > 750) {
        doc.addPage();
        startY = 60;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 150);
      doc.rect(margin, startY - 15, pageWidth - 2 * margin, rowHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`Total Amount: ${totalAmount}`, margin + 5, startY);

      doc.save('all_customers.pdf');
    });
  }

  exportInfoModalToPDF() {
    if (!this.selectedCustomer) return;
    const element = document.getElementById('customerInfoModalContent');
    if (!element) return;

    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF();
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`customer_${this.selectedCustomer?.id}.pdf`);
    });
  }
}
