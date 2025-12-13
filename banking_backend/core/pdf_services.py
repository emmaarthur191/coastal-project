"""PDF generation services for payslips and statements."""
import io
import os
from django.conf import settings
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from decimal import Decimal

# Company name
COMPANY_NAME = "Coastal Auto tech Cooperative Credit Union"
COMPANY_ADDRESS = "P.O. Box 123, Accra, Ghana"
COMPANY_PHONE = "+233 XX XXX XXXX"


def generate_generic_report_pdf(title, subtitle, headers, data, summary_data=None):
    """
    Generate a generic PDF report with company branding.
    
    Args:
        title (str): Report title
        subtitle (str): Report subtitle/period
        headers (list): List of column headers
        data (list): List of list/tuples containing row data
        summary_data (list): Optional list of summary key-values [['Total', '100']]
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                           rightMargin=15*mm, leftMargin=15*mm,
                           topMargin=15*mm, bottomMargin=15*mm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=5
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph(COMPANY_NAME, title_style))
    elements.append(Paragraph(COMPANY_ADDRESS, subtitle_style))
    elements.append(Paragraph(COMPANY_PHONE, subtitle_style))
    elements.append(Spacer(1, 10*mm))
    
    # Report Title
    elements.append(Paragraph(f"<b>{title}</b>", 
                              ParagraphStyle('ReportTitle', parent=styles['Heading2'], alignment=TA_CENTER)))
    if subtitle:
        elements.append(Paragraph(subtitle, subtitle_style))
    elements.append(Spacer(1, 5*mm))
    
    # Data Table
    if data and headers:
        # Prepare table data
        table_data = [headers] + data
        
        # dynamic column width
        col_count = len(headers)
        if col_count > 0:
            col_width = (180*mm) / col_count
            t = Table(table_data, colWidths=[col_width] * col_count)
            
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.1, 0.3, 0.5)),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(t)
    else:
        elements.append(Paragraph("No data available for this report.", styles['Normal']))
        
    elements.append(Spacer(1, 10*mm))
    
    # Summary Table (if provided)
    if summary_data:
        elements.append(Paragraph("<b>Summary</b>", styles['Heading3']))
        summary_table = Table(summary_data, colWidths=[60*mm, 100*mm])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.Color(0.95, 0.95, 0.95)),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 10*mm))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)
    elements.append(Paragraph(f"Generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    elements.append(Paragraph("Coastal Auto tech Cooperative Credit Union - Official Report", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_payslip_pdf(payslip):
    """Generate PDF payslip and save to file."""
    from .models import Payslip
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                           rightMargin=20*mm, leftMargin=20*mm,
                           topMargin=20*mm, bottomMargin=20*mm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=5
    )
    normal_style = styles['Normal']
    
    elements = []
    
    # Header
    elements.append(Paragraph(COMPANY_NAME, title_style))
    elements.append(Paragraph(COMPANY_ADDRESS, subtitle_style))
    elements.append(Paragraph(COMPANY_PHONE, subtitle_style))
    elements.append(Spacer(1, 10*mm))
    
    # Payslip Title
    elements.append(Paragraph(f"<b>PAYSLIP - {payslip.get_month_display()} {payslip.year}</b>", 
                              ParagraphStyle('PayslipTitle', parent=styles['Heading2'], alignment=TA_CENTER)))
    elements.append(Spacer(1, 5*mm))
    
    # Employee Info
    emp_data = [
        ['Employee Name:', payslip.staff.get_full_name()],
        ['Staff ID:', payslip.staff.staff_id or 'N/A'],
        ['Department:', payslip.staff.role.replace('_', ' ').title()],
        ['Pay Period:', f"{payslip.pay_period_start} to {payslip.pay_period_end}"],
    ]
    emp_table = Table(emp_data, colWidths=[60*mm, 100*mm])
    emp_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 8*mm))
    
    # Earnings Table
    elements.append(Paragraph("<b>EARNINGS</b>", normal_style))
    earnings_data = [
        ['Description', 'Amount (GHS)'],
        ['Basic Pay', f"{payslip.base_pay:,.2f}"],
        ['Allowances', f"{payslip.allowances:,.2f}"],
        ['Overtime Pay', f"{payslip.overtime_pay:,.2f}"],
        ['Bonuses', f"{payslip.bonuses:,.2f}"],
        ['Gross Pay', f"{payslip.gross_pay:,.2f}"],
    ]
    earnings_table = Table(earnings_data, colWidths=[100*mm, 60*mm])
    earnings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.1, 0.3, 0.5)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.9, 0.9, 0.9)),
    ]))
    elements.append(earnings_table)
    elements.append(Spacer(1, 5*mm))
    
    # Deductions Table
    elements.append(Paragraph("<b>DEDUCTIONS</b>", normal_style))
    deductions_data = [
        ['Description', 'Amount (GHS)'],
        ['SSNIT (13.5%)', f"{payslip.ssnit_contribution:,.2f}"],
        ['Tax Deduction', f"{payslip.tax_deduction:,.2f}"],
        ['Other Deductions', f"{payslip.other_deductions:,.2f}"],
        ['Total Deductions', f"{payslip.total_deductions:,.2f}"],
    ]
    deductions_table = Table(deductions_data, colWidths=[100*mm, 60*mm])
    deductions_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.5, 0.1, 0.1)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.9, 0.9, 0.9)),
    ]))
    elements.append(deductions_table)
    elements.append(Spacer(1, 8*mm))
    
    # Net Pay
    net_pay_data = [
        ['NET PAY', f"GHS {payslip.net_salary:,.2f}"],
    ]
    net_pay_table = Table(net_pay_data, colWidths=[100*mm, 60*mm])
    net_pay_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.Color(0.1, 0.4, 0.1)),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(net_pay_table)
    elements.append(Spacer(1, 15*mm))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)
    elements.append(Paragraph(f"Generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    elements.append(Paragraph("This is a computer-generated document. No signature required.", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_statement_pdf(statement, transactions):
    """Generate PDF account statement."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                           rightMargin=15*mm, leftMargin=15*mm,
                           topMargin=15*mm, bottomMargin=15*mm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=5
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph(COMPANY_NAME, title_style))
    elements.append(Paragraph(COMPANY_ADDRESS, subtitle_style))
    elements.append(Spacer(1, 8*mm))
    
    # Statement Title
    elements.append(Paragraph("<b>ACCOUNT STATEMENT</b>", 
                              ParagraphStyle('StatementTitle', parent=styles['Heading2'], alignment=TA_CENTER)))
    elements.append(Spacer(1, 5*mm))
    
    # Account Info
    acc_data = [
        ['Account Holder:', statement.account.user.get_full_name()],
        ['Account Number:', statement.account.account_number],
        ['Account Type:', statement.account.get_account_type_display()],
        ['Statement Period:', f"{statement.start_date} to {statement.end_date}"],
    ]
    acc_table = Table(acc_data, colWidths=[50*mm, 120*mm])
    acc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(acc_table)
    elements.append(Spacer(1, 5*mm))
    
    # Balance Summary
    summary_data = [
        ['Opening Balance:', f"GHS {statement.opening_balance:,.2f}"],
        ['Closing Balance:', f"GHS {statement.closing_balance:,.2f}"],
        ['Total Transactions:', str(statement.transaction_count)],
    ]
    summary_table = Table(summary_data, colWidths=[50*mm, 120*mm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 8*mm))
    
    # Transactions Table
    if transactions:
        elements.append(Paragraph("<b>TRANSACTION DETAILS</b>", styles['Normal']))
        tx_data = [['Date', 'Description', 'Type', 'Amount (GHS)']]
        for tx in transactions:
            amount_str = f"{tx.amount:,.2f}" if tx.amount >= 0 else f"({abs(tx.amount):,.2f})"
            tx_data.append([
                tx.timestamp.strftime('%Y-%m-%d'),
                tx.description[:40] or tx.get_transaction_type_display(),
                tx.get_transaction_type_display(),
                amount_str
            ])
        
        tx_table = Table(tx_data, colWidths=[30*mm, 70*mm, 30*mm, 40*mm])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.1, 0.3, 0.5)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(tx_table)
    else:
        elements.append(Paragraph("No transactions in this period.", styles['Normal']))
    
    elements.append(Spacer(1, 10*mm))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)
    elements.append(Paragraph(f"Generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}", footer_style))
    elements.append(Paragraph("This is a computer-generated statement.", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
