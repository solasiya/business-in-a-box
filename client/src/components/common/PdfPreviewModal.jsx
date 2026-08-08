import React, { useState } from 'react';
import { Download, ExternalLink, Printer, CheckCircle, FileText } from 'lucide-react';
import Modal from './Modal';

export default function PdfPreviewModal({ isOpen, onClose, order }) {
  const [downloaded, setDownloaded] = useState(false);

  if (!order) return null;

  const pdfUrl = `/api/orders/${order.id}/pdf`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${order.orderNumber || 'Document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`PDF Preview • ${order.orderNumber}`}
      maxWidth="850px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Action bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="#818cf8" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{order.orderNumber}.pdf</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {order.contactName} • R {order.total?.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              Print / Open
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              {downloaded ? <CheckCircle size={14} color="#10b981" /> : <Download size={14} />}
              {downloaded ? 'Downloaded!' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div style={{
          width: '100%',
          height: '560px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          background: '#1e232a'
        }}>
          <iframe
            src={pdfUrl}
            title="PDF Document Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </Modal>
  );
}
