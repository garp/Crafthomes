import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { prefixCurrencyInPrice } from './helper';
import type { TQuotation } from '../store/types/projectQuotation.types';
import type { TCurrency } from '../store/types/project.types';
import { format } from 'date-fns';

// Helper function to load image as base64
const loadImageAsBase64 = async (url: string, label = 'Image'): Promise<string | null> => {
  console.log(`Loading ${label} from:`, url);

  // Method 1: Fetch with cache-busting (avoids cached non-CORS responses)
  try {
    const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
    const response = await fetch(cacheBustUrl, {
      mode: 'cors',
      cache: 'no-store', // Force fresh request
    });

    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log(`✅ ${label} loaded via fetch successfully`);
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          console.error('FileReader error');
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      console.log('Fetch response not ok:', response.status);
    }
  } catch (fetchError) {
    console.log('Fetch failed:', fetchError);
  }

  // Method 2: Create fresh image with crossOrigin attribute
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      console.log(`⏱️ ${label} load timeout after 10s`);
      resolve(null);
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      console.log(`${label} loaded, attempting canvas conversion...`);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          console.log(`✅ ${label} converted to base64 via canvas`);
          resolve(dataURL);
        } else {
          console.error('Could not get canvas context');
          resolve(null);
        }
      } catch (e) {
        console.error(`❌ Canvas toDataURL failed (CORS tainted) for ${label}:`, e);
        console.log('💡 Try: Clear browser cache or check S3 CORS includes HEAD method');
        resolve(null);
      }
    };

    img.onerror = (e) => {
      clearTimeout(timeout);
      console.error(`❌ ${label} load error:`, e);
      resolve(null);
    };

    // Use cache-busting URL
    img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
  });
};

// Fallback company details (used when policy is null)
const FALLBACK_COMPANY_NAME = 'Estate Craft';
const FALLBACK_COMPANY_ADDRESS = '';
const FALLBACK_COMPANY_PHONE = '';

// Fallback account details (used when policy is null)
const FALLBACK_ACCOUNT_NAME = 'Estate Craft';
const FALLBACK_BANK = '';
const FALLBACK_ACCOUNT_NUMBER = '';
const FALLBACK_IFSC = '';
const FALLBACK_BRANCH = '';
const FALLBACK_GST_NO = '';

// Fallback Terms & Conditions
const FALLBACK_TERMS_AND_CONDITIONS = [
  'These Terms & Conditions apply to all purchases from Estate Craft. Please read them carefully.',
  'Product Representation: Designs and accessories shown are for representation only.',
  'Image and Color Variations: Images and colors are for reference and can vary.',
  'Delivery Periods: As per agreement.',
  'Order Placement: Requires advance payment and client sign-off.',
  'Assembly & Installation: As per agreement.',
  'Warranties: As per product specifications.',
];

export const generateQuotationPDF = async (
  quotation: TQuotation | undefined | null,
): Promise<void> => {
  if (!quotation) {
    console.error('No quotation data provided');
    return;
  }

  const quotationItems = (quotation as any).quotationItem || quotation.items || [];

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = 20;

  // Helper to format money (with or without "Rs " prefix; use without prefix for Price/Amount)
  const formatMoneyForPdf = (value: number, currency: TCurrency = 'INR', withPrefix = true) => {
    const raw = prefixCurrencyInPrice(value, currency, true);
    const str = raw.replace(/₹/g, 'Rs ');
    return withPrefix ? str : str.replace(/^Rs\s+/, '').trim();
  };

  // Get policy data or use fallbacks
  const policy = (quotation as any)?.policy;
  const accountName = policy?.bankAccountName || policy?.companyName || FALLBACK_ACCOUNT_NAME;
  const bank = policy?.bankName || FALLBACK_BANK;
  const accountNumber = policy?.bankAccountNumber || FALLBACK_ACCOUNT_NUMBER;
  const ifsc = policy?.bankIFSC || FALLBACK_IFSC;
  const branch = policy?.bankBranch || FALLBACK_BRANCH;
  const gstNo = policy?.gstIn || FALLBACK_GST_NO;

  // Footer details from policy
  const footerCompanyName = policy?.companyName || FALLBACK_COMPANY_NAME;
  const footerAddress = policy?.address || FALLBACK_COMPANY_ADDRESS;
  const footerCity = policy?.city || '';
  const footerState = policy?.state || '';
  const footerPincode = policy?.pincode || '';

  // Build full address for footer
  const fullAddress = policy
    ? [footerAddress, footerCity, footerState, footerPincode ? `PIN: ${footerPincode}` : null]
        .filter(Boolean)
        .join(', ')
    : FALLBACK_COMPANY_ADDRESS;

  // Get client data
  const clientData = quotation?.client as any;
  const clientName = clientData?.name || 'N/A';
  const clientAddress = clientData?.addresses?.[0]
    ? [
        clientData.addresses[0].building,
        clientData.addresses[0].street,
        clientData.addresses[0].locality,
        clientData.addresses[0].city,
        clientData.addresses[0].state,
        clientData.addresses[0].pincode ? `PIN: ${clientData.addresses[0].pincode}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : [clientData?.address, clientData?.city, clientData?.state].filter(Boolean).join(', ') ||
      'N/A';

  // Get quotation date
  const quotationDate = quotation?.startDate
    ? format(new Date(quotation.startDate), 'MMM dd, yyyy')
    : format(new Date(), 'MMM dd, yyyy');

  // ---------- HEADER: Logo + Company Name + HR ----------
  // Try to load logo from policy
  const logoUrl = policy?.logo;
  let logoBase64: string | null = null;

  console.log('Policy logo URL:', logoUrl);

  if (logoUrl) {
    logoBase64 = await loadImageAsBase64(logoUrl, 'Logo');
    console.log('Logo loaded:', logoBase64 ? 'success' : 'failed');
  }

  const logoHeight = 15;
  const logoWidth = 30;
  let logoAdded = false;

  if (logoBase64) {
    // Add logo image on the left
    try {
      // Detect image format from base64 string
      const imageFormat = logoBase64.includes('image/png')
        ? 'PNG'
        : logoBase64.includes('image/jpeg')
          ? 'JPEG'
          : logoBase64.includes('image/jpg')
            ? 'JPEG'
            : 'PNG';
      doc.addImage(logoBase64, imageFormat, marginLeft, y - 3, logoWidth, logoHeight);
      logoAdded = true;
      console.log('Logo added to PDF successfully');
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
      logoAdded = false;
    }
  }

  // Add company name (next to logo if logo exists, otherwise alone)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  if (logoAdded) {
    doc.text(footerCompanyName, marginLeft + logoWidth + 5, y + 6);
    y += logoHeight + 5;
  } else {
    doc.text(footerCompanyName, marginLeft, y + 5);
    y += 12;
  }

  // Draw HR line below header
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  // ---------- BILL TO & QUOTE SECTIONS (Side by Side) ----------
  const leftColWidth = contentWidth * 0.5;
  const rightColX = marginLeft + leftColWidth + 10;

  // BILL TO Section (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', marginLeft, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(clientName, marginLeft, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addressLines = doc.splitTextToSize(clientAddress, leftColWidth - 10);
  doc.text(addressLines, marginLeft, y);

  // QUOTE Section (Right) - Reset y for right column
  let rightY = y - 11;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Quote', rightColX, rightY);
  rightY += 10;

  // Quote details table
  doc.setFontSize(9);
  const labelX = rightColX;
  const valueX = pageWidth - marginRight;

  const addQuoteRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, labelX, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, valueX, rightY, { align: 'right' });
    rightY += 5;
  };

  addQuoteRow('Date:', quotationDate);
  addQuoteRow('Account Name:', accountName);
  addQuoteRow('Bank:', bank);
  addQuoteRow('Account Number:', accountNumber);
  addQuoteRow('IFSC:', ifsc);
  addQuoteRow('Branch:', branch);
  addQuoteRow('GST NO:', gstNo);

  if (quotation?.quoteId) {
    rightY += 2;
    addQuoteRow('Quote ID:', quotation.quoteId);
  }
  if (quotation?.name) {
    addQuoteRow('Quotation Name:', quotation.name);
  }

  // Move y past both columns
  y = Math.max(y + addressLines.length * 4 + 5, rightY + 5);

  // Description (if exists)
  if (quotation?.description) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description:', marginLeft, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(quotation.description, contentWidth);
    doc.text(descLines, marginLeft, y);
    y += descLines.length * 4 + 5;
  }

  y += 5;

  // ---------- PRODUCT TABLE ----------
  // Pre-load all product images
  const productImages: Map<number, string | null> = new Map();
  console.log('Loading product images...');

  await Promise.all(
    quotationItems.map(async (item: any, index: number) => {
      const imageUrl = item.attachment?.url || item.masterItem?.primaryFile?.[0]?.url;
      if (imageUrl) {
        const imageBase64 = await loadImageAsBase64(imageUrl, `Product ${index + 1}`);
        productImages.set(index, imageBase64);
      } else {
        productImages.set(index, null);
      }
    }),
  );

  console.log(`Loaded ${productImages.size} product images`);

  // Calculate totals
  let totalPrice = 0;
  let totalDiscount = 0;
  let totalGST = 0;
  let totalCurrency: TCurrency = 'INR';

  const tableBody = quotationItems.map((item: any, index: number) => {
    const itemName = item.masterItem?.name || item.name || 'N/A';
    // Prioritize item.mrp (static/editable MRP) over masterItem.mrp
    const itemPrice = item.mrp || item.price || item.masterItem?.mrp || 0;
    const quantity = item.quantity || 1;
    const discount = item.discount || 0;
    const gst = item.gst || 0;
    const total = item.total || 0;
    const currency: TCurrency = item.masterItem?.currency || 'INR';

    if (index === 0) totalCurrency = currency;

    const mrp = itemPrice * quantity;
    const discountAmount = mrp * (discount / 100);
    const priceAfterDiscount = mrp - discountAmount;
    const gstAmount = priceAfterDiscount * (gst / 100);

    totalPrice += mrp;
    totalDiscount += discountAmount;
    totalGST += gstAmount;

    const unitDisplay = item.unit?.name || item.unit?.displayName || '—';
    const areaDisplay =
      (item.areaRef?.name ?? item.area) && String(item.areaRef?.name ?? item.area).trim()
        ? String(item.areaRef?.name ?? item.area)
        : '—';
    const itemDescription = item.masterItem?.description || item.description;
    const hasDesc =
      itemDescription && String(itemDescription).trim() && String(itemDescription).trim() !== '—';
    const nameAndDesc = hasDesc ? `${itemName} - ${itemDescription}` : itemName;

    // Column order: S.No, Area, Image, Product & Description, Unit, Qty, Price, Amount, Discount, GST, Total
    return [
      (index + 1).toString(),
      areaDisplay,
      '', // Image drawn via didDrawCell (column index 2)
      nameAndDesc,
      unitDisplay,
      quantity.toString(),
      formatMoneyForPdf(itemPrice, currency, false),
      formatMoneyForPdf(mrp, currency, false),
      `${discount}%`,
      `${gst}%`,
      formatMoneyForPdf(total, currency),
    ];
  });

  // Column widths must sum to contentWidth; Amount and Discount wide enough so headers don't wrap
  const col = {
    sNo: 14,
    area: 12,
    image: 18,
    product: 26,
    unit: 14,
    qty: 11,
    price: 14,
    amount: 20,
    discount: 20,
    gst: 12,
    total: 17,
  };
  const tableTotalWidth = Object.values(col).reduce((a, b) => a + b, 0);
  const scale = contentWidth / tableTotalWidth;
  const w = (key: keyof typeof col) => Math.round(col[key] * scale);

  autoTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    head: [
      [
        'No.',
        'Area',
        'Image',
        'Product & Description',
        'Unit',
        'Qty',
        'Price',
        'Amount',
        'Discount',
        'GST',
        'Total',
      ],
    ],
    body: tableBody,
    theme: 'grid',
    columnStyles: {
      0: { halign: 'center', cellWidth: w('sNo') },
      1: { halign: 'left', cellWidth: w('area') },
      2: { halign: 'center', cellWidth: w('image') },
      3: { halign: 'left', cellWidth: w('product') },
      4: { halign: 'center', cellWidth: w('unit') },
      5: { halign: 'center', cellWidth: w('qty') },
      6: { halign: 'center', cellWidth: w('price') },
      7: { halign: 'center', cellWidth: w('amount') },
      8: { halign: 'center', cellWidth: w('discount') },
      9: { halign: 'center', cellWidth: w('gst') },
      10: { halign: 'center', cellWidth: w('total') },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: marginLeft, right: marginRight },
    didDrawCell: (data: any) => {
      // Draw product images in the Image column (column index 1)
      // Skip header rows (row.index is -1 for headers, or section === 'head')
      const isHeaderRow = data.row.index < 0 || data.section === 'head';
      if (data.column.index === 2 && !isHeaderRow && data.row.index >= 0) {
        const rowIndex = data.row.index;
        const imageBase64 = productImages.get(rowIndex);

        if (imageBase64) {
          try {
            // Detect image format from base64 string
            const imageFormat = imageBase64.includes('image/png')
              ? 'PNG'
              : imageBase64.includes('image/jpeg')
                ? 'JPEG'
                : imageBase64.includes('image/jpg')
                  ? 'JPEG'
                  : 'PNG';

            // Calculate image dimensions to fit in cell (max 20x20)
            const maxImageSize = 20;
            const cellHeight = data.row.height;
            const cellWidth = data.column.width;
            const imageSize = Math.min(maxImageSize, cellHeight - 6, cellWidth - 6);

            // Center the image in the cell
            const x = data.cell.x + (cellWidth - imageSize) / 2;
            const y = data.cell.y + (cellHeight - imageSize) / 2;

            doc.addImage(imageBase64, imageFormat, x, y, imageSize, imageSize);
          } catch (e) {
            console.error(`Error adding product image ${rowIndex} to PDF:`, e);
          }
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ---------- SUMMARY OF CHARGES ----------
  const grandTotal = quotation?.totalAmount || 0;
  const paidAmount = quotation?.paidAmount || 0;
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  const summaryX = pageWidth - marginRight - 80;

  doc.setFontSize(9);

  const addSummaryRow = (
    label: string,
    value: string,
    bold = false,
    color: [number, number, number] = [0, 0, 0],
  ) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(label, summaryX, y);
    doc.text(value, pageWidth - marginRight, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 5;
  };

  addSummaryRow('Total Price:', formatMoneyForPdf(totalPrice, totalCurrency));
  addSummaryRow('Total Discount:', formatMoneyForPdf(totalDiscount, totalCurrency));
  addSummaryRow('Total GST:', formatMoneyForPdf(totalGST, totalCurrency));

  if (paidAmount > 0) {
    addSummaryRow(
      'Paid Amount:',
      formatMoneyForPdf(paidAmount, totalCurrency),
      false,
      [34, 139, 34],
    );
    addSummaryRow(
      'Remaining Amount:',
      formatMoneyForPdf(remainingAmount, totalCurrency),
      false,
      [220, 20, 60],
    );
  }

  y += 2;
  doc.setDrawColor(150, 150, 150);
  doc.line(summaryX, y, pageWidth - marginRight, y);
  y += 5;

  addSummaryRow('Grand Total:', formatMoneyForPdf(grandTotal, totalCurrency), true);

  y += 10;

  // ---------- TERMS & CONDITIONS ----------
  // Always push Terms & Conditions to a new page
  doc.addPage();
  y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Terms & Conditions', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Helper function to render HTML content with proper formatting
  const renderHtmlContent = (html: string) => {
    // Parse HTML using a temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(text, contentWidth);
          checkPageBreak(lines.length * 4);
          doc.text(lines, marginLeft, y);
          y += lines.length * 4 + 2;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4': {
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(tagName === 'h1' ? 12 : tagName === 'h2' ? 11 : 10);
            const headerText = element.textContent?.trim() || '';
            const headerLines = doc.splitTextToSize(headerText, contentWidth);
            doc.text(headerLines, marginLeft, y);
            y += headerLines.length * 5 + 4;
            break;
          }

          case 'p': {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            // Process child nodes for bold/italic within paragraph
            let pText = '';
            element.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                pText += child.textContent || '';
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childEl = child as HTMLElement;
                if (
                  childEl.tagName.toLowerCase() === 'strong' ||
                  childEl.tagName.toLowerCase() === 'b'
                ) {
                  pText += childEl.textContent || '';
                } else {
                  pText += childEl.textContent || '';
                }
              }
            });
            if (pText.trim()) {
              const pLines = doc.splitTextToSize(pText.trim(), contentWidth);
              checkPageBreak(pLines.length * 4);
              doc.text(pLines, marginLeft, y);
              y += pLines.length * 4 + 3;
            }
            break;
          }

          case 'ul':
          case 'ol': {
            let listIndex = 1;
            element.querySelectorAll(':scope > li').forEach((li) => {
              const bullet = tagName === 'ol' ? `${listIndex}. ` : '• ';
              const liText = li.textContent?.trim() || '';
              if (liText) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                const liLines = doc.splitTextToSize(bullet + liText, contentWidth - 10);
                checkPageBreak(liLines.length * 4);
                doc.text(liLines, marginLeft + 5, y);
                y += liLines.length * 4 + 2;
              }
              listIndex++;
            });
            y += 2;
            break;
          }

          case 'li':
            // Handled by ul/ol
            break;

          case 'br':
            y += 3;
            break;

          case 'strong':
          case 'b':
            // Handled inline within paragraphs
            break;

          default:
            // For other elements, just process their children
            element.childNodes.forEach((child) => processNode(child));
        }
      }
    };

    tempDiv.childNodes.forEach((child) => processNode(child));
  };

  if (policy?.termsAndConditions) {
    renderHtmlContent(policy.termsAndConditions);
  } else {
    // Use fallback terms
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    FALLBACK_TERMS_AND_CONDITIONS.forEach((term) => {
      const termLines = doc.splitTextToSize('• ' + term, contentWidth);
      checkPageBreak(termLines.length * 4);
      doc.text(termLines, marginLeft, y);
      y += termLines.length * 4 + 2;
    });
  }

  // ---------- FOOTER (Always at bottom of page) ----------
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerStartY = pageHeight - 45; // Start footer 45 units from bottom

  // Client Signature - positioned above footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Client Signature', pageWidth - marginRight, footerStartY, { align: 'right' });

  // Footer content at the very bottom
  const footerY = pageHeight - 25;

  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(footerCompanyName, pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(fullAddress, pageWidth / 2, footerY + 4, { align: 'center' });

  if (!policy) {
    doc.text(`Ph No. ${FALLBACK_COMPANY_PHONE}`, pageWidth / 2, footerY + 8, { align: 'center' });
  } else if (policy.website) {
    doc.text(policy.website, pageWidth / 2, footerY + 8, { align: 'center' });
  }

  // ---------- FILENAME ----------
  const safeClient = clientName.trim().replace(/\s+/g, '_');
  const quoteId = quotation.quoteId ? `_${quotation.quoteId}` : '';
  const filename = `Quotation_${safeClient}${quoteId}.pdf`;

  doc.save(filename);
};
