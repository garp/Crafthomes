import { useEffect, useMemo, useState } from 'react';
import { IconFileSpreadsheet, IconFileTypePdf } from '@tabler/icons-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import DialogModal from '../base/ModalWrapper';
import { Button } from '../base';
import FormDate from '../base/FormDate';
import FormInput from '../base/FormInput';
import FormSelect from '../base/FormSelect';
import FormMultiSelect from '../base/FormMultiSelect';
import { useGetProjectsQuery } from '../../store/services/project/projectSlice';
import { useGetUserSettingsQuery } from '../../store/services/settings/settings';
import { toast } from 'react-toastify';
import type { TTimesheet } from '../../store/types/timesheet.types';
import type { TProject } from '../../store/types/project.types';

const EMPTY_PROJECTS: TProject[] = [];

type TTimesheetExportModalProps = {
  opened: boolean;
  onClose: () => void;
  timesheets: TTimesheet[];
  projects?: TProject[];
};

type TExportFormat = 'excel' | 'pdf';

// Helper functions
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '-';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, '0')}`;
}

function formatDurationForExport(minutes: number | null | undefined): string {
  if (!minutes) return '-';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hrsStr = hrs < 10 ? hrs.toString().padStart(2, '0') : hrs.toString();
  return `${hrsStr}:${mins.toString().padStart(2, '0')}`;
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  try {
    return format(new Date(isoString), 'yyyy-MM-dd');
  } catch {
    return '-';
  }
}

function stripHtmlToText(input: string): string {
  const raw = input ?? '';
  if (!raw) return '';
  try {
    // DOMParser gives better results than regex for most HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');
    const text = doc.body?.textContent ?? '';
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    // Fallback (best-effort)
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

function formatPeriodDate(date: Date | null): string {
  if (!date) return '-';
  try {
    return format(date, 'M/d/yy');
  } catch {
    return '-';
  }
}

function sanitizeBaseFilename(name: string): string {
  // Remove illegal filename characters across OSes and collapse whitespace
  const withoutExt = name.replace(/\.(pdf|xlsx|xls)$/i, '');
  const replacedIllegal = withoutExt.replace(/[<>:"/\\|?*]/g, '_');
  // Avoid control-character regex (ESLint no-control-regex); strip chars with code < 32
  const replacedControlChars = Array.from(replacedIllegal)
    .map((ch) => (ch.charCodeAt(0) < 32 ? '_' : ch))
    .join('');
  return replacedControlChars.replace(/\s+/g, ' ').trim().slice(0, 120);
}

export default function TimesheetExportModal({
  opened,
  onClose,
  timesheets,
  projects: externalProjects,
}: TTimesheetExportModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [fileBaseName, setFileBaseName] = useState('');

  const getDefaultBaseName = () => `Timesheet_${format(new Date(), 'yyyy-MM-dd')}`;

  useEffect(() => {
    if (opened) setFileBaseName(getDefaultBaseName());
  }, [opened]);

  // Fetch projects if not provided
  const { data: projectsData } = useGetProjectsQuery(
    { pageLimit: '1000', pageNo: '0' },
    { skip: !!externalProjects || !opened },
  );

  const projectsList = externalProjects ?? projectsData?.projects ?? EMPTY_PROJECTS;

  const { data: userSettingsData } = useGetUserSettingsQuery(
    { pageLimit: '500', pageNo: '0' },
    { skip: !opened },
  );

  const userOptions = useMemo(() => {
    const users = userSettingsData?.data?.users ?? [];
    return users.map((u) => ({
      label: u.name || u.email || u.id,
      value: u.id,
    }));
  }, [userSettingsData?.data?.users]);

  const projectOptions = useMemo(() => {
    return [
      { label: 'All Projects', value: '' },
      ...projectsList.map((p) => ({
        label: p.name,
        value: p.id,
      })),
    ];
  }, [projectsList]);

  const getProjectById = (projectId: string | null | undefined): TProject | undefined => {
    if (!projectId) return undefined;
    return projectsList.find((p) => p.id === projectId);
  };

  const getProjectName = (projectId: string | null | undefined): string => {
    if (!projectId) return '-';
    const project = projectsList.find((p) => p.id === projectId);
    return project?.name || '-';
  };

  const getCustomerName = (projectId: string | null | undefined): string => {
    const project = getProjectById(projectId);
    return project?.client?.name || '-';
  };

  const getFilteredData = (): TTimesheet[] => {
    let data = [...timesheets];

    if (selectedProjectId) {
      data = data.filter((t) => t.projectId === selectedProjectId);
    }

    if (selectedUserIds.length > 0) {
      data = data.filter((t) => t.userId && selectedUserIds.includes(t.userId));
    }

    if (fromDate) {
      data = data.filter((t) => {
        const tsDate = new Date(t.date);
        return tsDate >= fromDate;
      });
    }

    if (toDate) {
      data = data.filter((t) => {
        const tsDate = new Date(t.date);
        return tsDate <= toDate;
      });
    }

    return data;
  };

  const transformDataForExcel = (data: TTimesheet[]) => {
    return data.map((ts) => {
      const tasksName = Array.isArray(ts.tasks)
        ? ts.tasks
            .map((t) => t?.name)
            .filter(Boolean)
            .join(', ')
        : '';

      const startTime = ts.startTime ? format(new Date(ts.startTime), 'HH:mm') : '-';
      const endTime = ts.endTime ? format(new Date(ts.endTime), 'HH:mm') : '-';

      return {
        Date: formatDate(ts.date),
        'Start Time': startTime,
        'End Time': endTime,
        Duration: formatDurationForExport(ts.durationMinutes ?? ts.duration),
        Project: getProjectName(ts.projectId),
        Tasks: tasksName || '-',
        Description: ts.description ? stripHtmlToText(ts.description) : '-',
      };
    });
  };

  const exportToExcel = (data: TTimesheet[], baseName: string) => {
    const transformedData = transformDataForExcel(data);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    worksheet['!cols'] = [
      { wch: 12 }, // Date
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 10 }, // Duration
      { wch: 28 }, // Project
      { wch: 40 }, // Tasks
      { wch: 70 }, // Description
    ];

    // Add autofilter to header row (like your reference sheet)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
    XLSX.writeFile(workbook, `${baseName}.xlsx`);
  };

  const exportToPDF = (data: TTimesheet[], baseName: string) => {
    const doc = new jsPDF();

    // Sort by date/start time for stable output
    const sorted = [...data].sort((a, b) => {
      const aTime = new Date(a.startTime || a.date).getTime();
      const bTime = new Date(b.startTime || b.date).getTime();
      return aTime - bTime;
    });

    // -------------------------
    // Page 1: Summary
    // -------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Export of timesheets', 14, 18);

    const periodText = `Period: ${formatPeriodDate(fromDate)} - ${formatPeriodDate(toDate)}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(periodText, 14, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Summary', 14, 44);

    // Group by Customer + Project
    const summaryMap = new Map<string, { customer: string; project: string; minutes: number }>();
    for (const ts of sorted) {
      const customer = getCustomerName(ts.projectId);
      const project = getProjectName(ts.projectId);
      const minutes = ts.durationMinutes ?? ts.duration ?? 0;
      const key = `${customer}||${project}`;
      const prev = summaryMap.get(key);
      if (prev) summaryMap.set(key, { ...prev, minutes: prev.minutes + minutes });
      else summaryMap.set(key, { customer, project, minutes });
    }

    const summaryRows = Array.from(summaryMap.values()).sort((a, b) => {
      if (a.customer !== b.customer) return a.customer.localeCompare(b.customer);
      return a.project.localeCompare(b.project);
    });
    const totalMinutes = summaryRows.reduce((sum, r) => sum + r.minutes, 0);

    autoTable(doc, {
      startY: 52,
      head: [['Customer', 'Project', 'Duration']],
      body: [
        ...summaryRows.map((r) => [r.customer, r.project, formatDuration(r.minutes)]),
        ['Total', '', formatDuration(totalMinutes)],
      ],
      theme: 'grid',
      styles: { fontSize: 12, cellPadding: 4, valign: 'middle' },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'left', cellWidth: 60 },
        2: { halign: 'center', cellWidth: 40 },
      },
      didParseCell: (hookData) => {
        const isTotalRow = hookData.section === 'body' && hookData.row.index === summaryRows.length;
        if (isTotalRow) {
          hookData.cell.styles.fontStyle = 'bold';
          // visually emulate a merged cell by clearing the middle cell and keeping borders
          if (hookData.column.index === 1) hookData.cell.text = [''];
        }
      },
      margin: { left: 14, right: 14 },
    });

    // -------------------------
    // Page 2: Full list
    // -------------------------
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Full list', 14, 18);

    const fullListMeta = sorted.map((ts) => {
      const start = ts.startTime ? format(new Date(ts.startTime), 'M/d/yy hh:mm a') : '';
      const end = ts.endTime ? format(new Date(ts.endTime), 'M/d/yy hh:mm a') : '';
      const dateCell = [start, end].filter(Boolean).join('\n') || formatDate(ts.date);

      const customer = getCustomerName(ts.projectId);
      const project = getProjectName(ts.projectId);
      const tasks = Array.isArray(ts.tasks) ? ts.tasks.map((t) => t?.name).filter(Boolean) : [];
      const headerLine = `${customer} - ${project}`;
      const tasksLine = tasks.length ? tasks.join(', ') : '';
      const descText = ts.description ? stripHtmlToText(ts.description) : '';

      return {
        dateCell,
        headerLine,
        tasksLine,
        descText,
        duration: formatDuration(ts.durationMinutes ?? ts.duration),
      };
    });

    const fullListBody = fullListMeta.map((r) => [r.dateCell, '', r.duration]);

    autoTable(doc, {
      startY: 26,
      head: [['Date', 'Description', 'Duration']],
      body: fullListBody,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4, valign: 'top' },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'left', cellWidth: 125 },
        2: { halign: 'center', cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didParseCell: (hookData) => {
        // Increase row height for our custom rendered multi-line description
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const idx = hookData.row.index;
          const meta = fullListMeta[idx];
          if (!meta) return;

          const cellWidth = hookData.cell.width || 0;
          const usableWidth = Math.max(10, cellWidth - 8); // subtract padding (approx)

          const headerLines = hookData.doc.splitTextToSize(
            meta.headerLine || '',
            usableWidth,
          ) as string[];
          const taskLines = meta.tasksLine
            ? (hookData.doc.splitTextToSize(meta.tasksLine, usableWidth) as string[])
            : [];
          const descLines = meta.descText
            ? (hookData.doc.splitTextToSize(meta.descText, usableWidth) as string[])
            : [];

          const totalLines =
            headerLines.length +
            (taskLines.length ? taskLines.length + 1 : 0) +
            (descLines.length ? descLines.length + 1 : 0);
          const lineH = 5; // approx line height in jsPDF units
          const needed = Math.max(14, totalLines * lineH + 8);
          hookData.cell.styles.minCellHeight = Math.max(
            hookData.cell.styles.minCellHeight || 0,
            needed,
          );

          // Prevent default text rendering (we'll draw manually)
          hookData.cell.text = [''];
        }
      },
      didDrawCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const idx = hookData.row.index;
          const meta = fullListMeta[idx];
          if (!meta) return;

          const docRef = hookData.doc;
          const cell = hookData.cell;
          const x = cell.x + 4;
          let y = cell.y + 7;
          const usableWidth = Math.max(10, cell.width - 8);

          // Header line (normal)
          docRef.setFont('helvetica', 'normal');
          docRef.setFontSize(10);
          const headerLines = docRef.splitTextToSize(
            meta.headerLine || '',
            usableWidth,
          ) as string[];
          docRef.text(headerLines, x, y);
          y += headerLines.length * 5;

          // Tasks line (bold)
          if (meta.tasksLine) {
            y += 2;
            docRef.setFont('helvetica', 'bold');
            docRef.setFontSize(10);
            const taskLines = docRef.splitTextToSize(meta.tasksLine, usableWidth) as string[];
            docRef.text(taskLines, x, y);
            y += taskLines.length * 5;
          }

          // Description (normal)
          if (meta.descText) {
            y += 2;
            docRef.setFont('helvetica', 'normal');
            docRef.setFontSize(10);
            const descLines = docRef.splitTextToSize(meta.descText, usableWidth) as string[];
            docRef.text(descLines, x, y);
          }
        }
      },
    });

    doc.save(`${baseName}.pdf`);
  };

  const handleExport = async (exportFormat: TExportFormat) => {
    setIsExporting(true);
    try {
      const dataToExport = getFilteredData();

      if (dataToExport.length === 0) {
        toast.warning('No timesheet entries match the selected filters');
        setIsExporting(false);
        return;
      }

      const fallback = getDefaultBaseName();
      const resolvedBaseName = sanitizeBaseFilename(fileBaseName || fallback) || fallback;

      switch (exportFormat) {
        case 'excel':
          exportToExcel(dataToExport, resolvedBaseName);
          break;
        case 'pdf':
          exportToPDF(dataToExport, resolvedBaseName);
          break;
      }

      toast.success(
        `Successfully exported ${dataToExport.length} timesheet entries to ${exportFormat.toUpperCase()}`,
      );
      handleClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setFileBaseName('');
    setSelectedProjectId(null);
    setSelectedUserIds([]);
    setFromDate(null);
    setToDate(null);
    onClose();
  };

  return (
    <DialogModal opened={opened} onClose={handleClose} title='Export Timesheet' size='md'>
      <div className='space-y-5'>
        {/* Vertical / stacked form */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700'>File name</label>
            <FormInput
              placeholder='Enter file name'
              value={fileBaseName}
              onChange={(e) => setFileBaseName(e.target.value)}
            />
            <p className='text-xs text-gray-500'>
              PDF/Excel extension will be added automatically.
            </p>
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700'>Project</label>
            <FormSelect
              value={selectedProjectId || ''}
              onChange={(value) => setSelectedProjectId(value as string | null)}
              placeholder='All Projects'
              searchable
              options={projectOptions}
              className='w-full'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700'>Users</label>
            <FormMultiSelect
              value={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder='All users'
              searchable
              options={userOptions}
              className='w-full'
            />
            <p className='text-xs text-gray-500'>Leave empty to include all users in the export.</p>
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700'>From Date</label>
            <FormDate
              value={fromDate}
              onChange={(date) =>
                setFromDate(date ? (typeof date === 'string' ? new Date(date) : date) : null)
              }
              placeholder='Select start date'
              clearable
              maxDate={toDate || undefined}
              className='w-full'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700'>To Date</label>
            <FormDate
              value={toDate}
              onChange={(date) =>
                setToDate(date ? (typeof date === 'string' ? new Date(date) : date) : null)
              }
              placeholder='Select end date'
              clearable
              minDate={fromDate || undefined}
              className='w-full'
            />
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-end gap-3 pt-4 border-t cursor-pointer'>
          <Button variant='outline' radius='md' onClick={handleClose} disabled={isExporting}>
            Close
          </Button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className='inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium'
          >
            <IconFileTypePdf className='w-4 h-4' />
            PDF
          </button>

          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className='inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium'
          >
            <IconFileSpreadsheet className='w-4 h-4' />
            Excel
          </button>
        </div>
      </div>
    </DialogModal>
  );
}
