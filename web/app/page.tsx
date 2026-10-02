'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Database, 
  FileSpreadsheet, 
  Store, 
  CreditCard, 
  RefreshCw, 
  Search, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  UploadCloud,
  FileUp,
  FolderOpen,
  Play,
  X,
  HardDrive,
  Copy,
  Calendar,
  PieChart,
  Scale,
  Receipt,
  DollarSign,
  ArrowDownRight,
  Percent
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'transactions' | 'files' | 'outlets' | 'coa'>('overview');
  
  // Financial State
  const [financialYear, setFinancialYear] = useState('2023');
  const [financialSubTab, setFinancialSubTab] = useState<'pl' | 'bs' | 'trend' | 'tb'>('pl');
  const [financialData, setFinancialData] = useState<any>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [tbSearch, setTbSearch] = useState('');
  const [tbSeriesFilter, setTbSeriesFilter] = useState('');
  
  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Folders State
  const [folders, setFolders] = useState<any[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  // Files State
  const [files, setFiles] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importOutput, setImportOutput] = useState<string | null>(null);

  // Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [trxLoading, setTrxLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Outlets State
  const [outlets, setOutlets] = useState<any[]>([]);
  const [outletFilter, setOutletFilter] = useState('');

  // COA State
  const [coas, setCoas] = useState<any[]>([]);
  const [coaSeriesFilter, setCoaSeriesFilter] = useState('');

  // Fetch initial stats
  useEffect(() => {
    fetchStats();
    fetchFolders();
  }, []);

  // Fetch data per tab
  useEffect(() => {
    if (activeTab === 'files') {
      fetchFiles();
      fetchFolders();
    }
    if (activeTab === 'financial') fetchFinancial(financialYear);
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'outlets') fetchOutlets();
    if (activeTab === 'coa') fetchCoas();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'financial') {
      fetchFinancial(financialYear);
    }
  }, [financialYear]);

  const fetchFinancial = async (year = financialYear) => {
    setFinancialLoading(true);
    try {
      const res = await fetch(`/api/financial?year=${year}`);
      const data = await res.json();
      if (data.success) {
        setFinancialData(data.data);
      }
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setFinancialLoading(false);
    }
  };

  // Refetch transactions on filter change
  useEffect(() => {
    if (activeTab === 'transactions') {
      const timer = setTimeout(() => {
        fetchTransactions();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [page, search, selectedLocation, selectedType]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFolders = async () => {
    setFoldersLoading(true);
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (data.success) {
        setFolders(data.data);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setFoldersLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const fetchTransactions = async () => {
    setTrxLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search: search,
        location: selectedLocation,
        type: selectedType
      });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTrxLoading(false);
    }
  };

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/outlets');
      const data = await res.json();
      if (data.success) {
        setOutlets(data.data);
      }
    } catch (err) {
      console.error('Error fetching outlets:', err);
    }
  };

  const fetchCoas = async () => {
    try {
      const res = await fetch('/api/coa');
      const data = await res.json();
      if (data.success) {
        setCoas(data.data);
      }
    } catch (err) {
      console.error('Error fetching coas:', err);
    }
  };

  const handleRunImport = async (force = false) => {
    setImporting(true);
    setImportOutput('Memulai engine impor seluruh folder tahun (2018-2023) ke PostgreSQL...\nHarap tunggu sebentar...');
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      setImportOutput(data.output || (data.success ? data.message : `Error: ${data.error}`));
      fetchStats();
      fetchFiles();
      fetchFolders();
    } catch (err: any) {
      setImportOutput(`Error menjalankan import: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith('.xls') || f.name.endsWith('.xlsx')
      );
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setImportOutput(`Mengunggah ${selectedFiles.length} file ke server...\nMemproses parsing dan impor ke PostgreSQL...`);
    
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImportOutput(data.output || data.message);
        setSelectedFiles([]);
        fetchStats();
        fetchFiles();
        fetchFolders();
      } else {
        setImportOutput(`Error Upload: ${data.error}`);
      }
    } catch (err: any) {
      setImportOutput(`Gagal mengunggah file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatIDR = (val: number | string | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getTrxTypeBadge = (type: string) => {
    switch (type) {
      case 'POSSTOCK_REGULAR':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">POS Struk</span>;
      case 'POSSTOCK_COND':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">BOM Bahan/Cond</span>;
      case 'SALES_INVOICE_SI':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Invoice Penjualan</span>;
      case 'STOCK_TRANSFER_ST':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Stock Transfer</span>;
      case 'CREDIT_CARD_COMMISSION':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300">MDR EDC Bank</span>;
      case 'BACKOFFICE_AR':
      case 'BACKOFFICE_GL':
      case 'BACKOFFICE_CO':
      case 'BACKOFFICE_CI':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">Jurnal BO</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">{type}</span>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-wide">POS EMERALD</h1>
              <p className="text-xs text-emerald-400 font-medium">Häagen-Dazs • MRA</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Ringkasan Eksekutif</span>
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'financial'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Laporan Finansial (P&L & BS)</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'files'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Folder 2018-2024 & Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Transaksi POS ({stats?.summary?.totalTransactions?.toLocaleString() || '...'})</span>
            </button>

            <button
              onClick={() => setActiveTab('outlets')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'outlets'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Cabang & Outlet ({stats?.summary?.totalOutlets || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('coa')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'coa'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Chart of Accounts ({stats?.summary?.totalCoas || 0})</span>
            </button>
          </nav>
        </div>

        {/* Database Status Tag */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PostgreSQL 17 Terhubung</span>
            </div>
            <p className="text-xs text-slate-400">Database: <code className="text-slate-300">pos_emerald</code></p>
            <p className="text-xs text-slate-500 mt-1">Host: 127.0.0.1:5432</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'overview' && 'Cockpit Analitik & Ringkasan Eksekutif'}
              {activeTab === 'financial' && 'Laporan Finansial: Laba Rugi (P&L), Neraca (Balance Sheet) & Trend'}
              {activeTab === 'transactions' && 'Penjelajah Buku Besar & Transaksi POS'}
              {activeTab === 'files' && 'Manajemen Folder Tahun (2018-2024) & File Sync'}
              {activeTab === 'outlets' && 'Performa 138 Outlet & Cabang Ritel'}
              {activeTab === 'coa' && 'Bagan Akun Standar (647 COA Master)'}
            </h2>
            <p className="text-xs text-slate-500">PT. Rahayu Arumdhani International • Häagen-Dazs Indonesia</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleRunImport(false)}
              disabled={importing || uploading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
              <span>{importing ? 'Memproses Seluruh File...' : '⚡ Scan & Sync Semua Tahun'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transaksi POS</span>
                    <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Database className="w-4 h-4" /></span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">
                    {stats?.summary?.totalTransactions?.toLocaleString('id-ID') || 0}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Dari {stats?.summary?.totalFiles || 0} file backup diimpor</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">HPP Es Krim (COGS)</span>
                    <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></span>
                  </div>
                  <h3 className="text-2xl font-black text-blue-700 mt-2">
                    {formatIDR(stats?.summary?.totalCogs)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Akun 7001 & 7002 (Kemasan & Kreasi)</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diskon Penjualan POS</span>
                    <span className="p-2 rounded-lg bg-amber-50 text-amber-600"><ArrowUpRight className="w-4 h-4" /></span>
                  </div>
                  <h3 className="text-2xl font-black text-amber-700 mt-2">
                    {formatIDR(stats?.summary?.totalSalesDiscount)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Akun 5001 & 5002 (Invoice SI)</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biaya MDR EDC Bank</span>
                    <span className="p-2 rounded-lg bg-purple-50 text-purple-600"><CreditCard className="w-4 h-4" /></span>
                  </div>
                  <h3 className="text-2xl font-black text-purple-700 mt-2">
                    {formatIDR(stats?.summary?.totalEdcCommission)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Akun 8300.04.01 Credit Card Fee</p>
                </div>
              </div>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Outlets Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Top 6 Outlet Transaksi Tertinggi</span>
                    </h4>
                    <span className="text-xs text-slate-400">Total Volume</span>
                  </div>
                  <div className="space-y-3.5">
                    {stats?.topOutlets?.map((outlet: any, idx: number) => {
                      const maxTrx = stats.topOutlets[0]?.total_trx || 1;
                      const pct = Math.round((outlet.total_trx / maxTrx) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-800">{idx + 1}. {outlet.location_name}</span>
                            <span className="text-slate-600 font-bold">{Number(outlet.total_trx).toLocaleString()} trx</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Selling Menu Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span>Top 6 Produk Es Krim Paling Laris</span>
                    </h4>
                    <span className="text-xs text-slate-400">Berdasarkan Sales Invoice</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {stats?.topProducts?.map((prod: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{prod.item_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-700">{Number(prod.total_qty).toLocaleString()} pcs</span>
                          <div className="text-[10px] text-slate-400">{formatIDR(prod.total_amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCIAL REPORTS (P&L, BALANCE SHEET, TRIAL BALANCE) */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Year Selector & View Controls Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> Financial Cockpit
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Laporan Keuangan Häagen-Dazs Indonesia</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Konsolidasi Laporan Laba Rugi (P&L), Neraca (Balance Sheet) & Neraca Saldo Buku Besar
                  </p>
                </div>

                {/* Filter per Tahun */}
                <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                  {['2024', '2023', '2022', '2021', '2020', '2019', '2018', 'ALL'].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setFinancialYear(yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        financialYear === yr
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                      }`}
                    >
                      {yr === 'ALL' ? 'Semua Tahun' : yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setFinancialSubTab('pl')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    financialSubTab === 'pl'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Laporan Laba Rugi (P&L)</span>
                </button>

                <button
                  onClick={() => setFinancialSubTab('bs')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    financialSubTab === 'bs'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>Neraca Keuangan (Balance Sheet)</span>
                </button>

                <button
                  onClick={() => setFinancialSubTab('trend')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    financialSubTab === 'trend'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tren Bulanan & Analisis Margin</span>
                </button>

                <button
                  onClick={() => setFinancialSubTab('tb')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    financialSubTab === 'tb'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 text-purple-400" />
                  <span>Neraca Saldo Akun (Trial Balance)</span>
                </button>

                {financialLoading && (
                  <span className="text-xs text-emerald-600 flex items-center space-x-1 animate-pulse ml-auto">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memuat data finansial...</span>
                  </span>
                )}
              </div>

              {/* SUBTAB 1: PROFIT & LOSS (LABA RUGI) */}
              {financialSubTab === 'pl' && financialData && (
                <div className="space-y-6">
                  {/* Executive KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                        <span>Penjualan Bersih (Net)</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mt-1">
                        {formatIDR(financialData.pl.net_sales)}
                      </h4>
                      {financialData.yoy && (
                        <div className="flex items-center space-x-1 mt-1 text-[11px] font-bold">
                          <span className={financialData.yoy.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {financialData.yoy.revenueGrowth >= 0 ? '▲ +' : '▼ '}
                            {financialData.yoy.revenueGrowth.toFixed(1)}% YoY
                          </span>
                          <span className="text-slate-400">vs {financialData.yoy.priorYear}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                        <span>Laba Kotor (GP)</span>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-black text-blue-700 mt-1">
                        {formatIDR(financialData.pl.gross_profit)}
                      </h4>
                      <p className="text-xs font-bold text-blue-600 mt-1">
                        Margin GP: {financialData.pl.gp_margin.toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                        <span>Beban Operasional (OPEX)</span>
                        <ArrowDownRight className="w-4 h-4 text-amber-600" />
                      </div>
                      <h4 className="text-xl font-black text-amber-700 mt-1">
                        {formatIDR(financialData.pl.total_opex)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        OPEX %: {((financialData.pl.total_opex / financialData.pl.net_sales) * 100).toFixed(1)}% of Sales
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                        <span>Laba Usaha (EBIT)</span>
                        <Percent className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h4 className={`text-xl font-black mt-1 ${financialData.pl.ebit >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                        {formatIDR(financialData.pl.ebit)}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        EBIT Margin: {financialData.pl.ebit_margin.toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-tr from-slate-900 to-emerald-950 p-4 rounded-xl text-white shadow-md">
                      <div className="flex items-center justify-between text-slate-300 text-xs font-semibold uppercase">
                        <span>Laba Bersih (NPBT)</span>
                        <Scale className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className={`text-xl font-black mt-1 ${financialData.pl.npbt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatIDR(financialData.pl.npbt)}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        Net Margin: {financialData.pl.npbt_margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Structured Corporate P&L Waterfall Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm">LAPORAN LABA RUGI (PROFIT & LOSS STATEMENT)</h4>
                        <p className="text-xs text-slate-400">Periode: Tahun {financialYear === 'ALL' ? '2018 - 2024 (Konsolidasi)' : financialYear} • Mata Uang: IDR (Rupiah)</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                        Standar Keuangan IFRS / PSAK
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {/* I. PENDAPATAN */}
                      <div className="bg-slate-50/80 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        I. PENDAPATAN USAHA (REVENUE)
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50">
                        <span className="text-slate-700 font-medium">Penjualan Kotor Kasir & Backoffice (Gross Sales)</span>
                        <span className="font-mono text-slate-900 font-semibold">{formatIDR(financialData.pl.gross_sales)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-rose-600">
                        <span className="font-medium">Potongan & Diskon Penjualan (Sales Discounts - Seri 5000)</span>
                        <span className="font-mono font-semibold">({formatIDR(financialData.pl.sales_discounts)})</span>
                      </div>
                      <div className="flex justify-between px-4 py-3 bg-emerald-50/60 text-emerald-950 font-bold border-y border-emerald-200">
                        <span>TOTAL PENJUALAN BERSIH (NET REVENUE)</span>
                        <span className="font-mono text-sm">{formatIDR(financialData.pl.net_sales)}</span>
                      </div>

                      {/* II. BEBAN POKOK PENJUALAN */}
                      <div className="bg-slate-50/80 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        II. HARGA POKOK PENJUALAN (COGS / HPP)
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>HPP Es Krim Cafe & Menu Olahan (Bahan Baku, Cup, Packaging - Seri 7000 Cafe)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.cogs_cafe)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>HPP Penjualan Barang Retail (Seri 7000 Retail)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.cogs_retail)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2.5 bg-rose-50/60 text-rose-950 font-bold border-y border-rose-200">
                        <span>TOTAL HARGA POKOK PENJUALAN (TOTAL COGS)</span>
                        <span className="font-mono">{formatIDR(financialData.pl.total_cogs)}</span>
                      </div>

                      {/* LABA KOTOR */}
                      <div className="flex justify-between items-center px-4 py-3.5 bg-emerald-600 text-white font-bold text-sm shadow-inner">
                        <div className="flex items-center space-x-2">
                          <span>LABA KOTOR (GROSS PROFIT)</span>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-white/20 text-white font-semibold">
                            Margin GP: {financialData.pl.gp_margin.toFixed(1)}%
                          </span>
                        </div>
                        <span className="font-mono text-base">{formatIDR(financialData.pl.gross_profit)}</span>
                      </div>

                      {/* III. BEBAN OPERASIONAL */}
                      <div className="bg-slate-50/80 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        III. BEBAN OPERASIONAL (OPERATING EXPENSES / OPEX)
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Beban Gaji, Upah & Tunjangan Karyawan (Seri 8100)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_personnel)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Beban Pemasaran & Promosi (Seri 8200)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_marketing)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Beban Umum & Administrasi / Sewa Outlet Mall & Utilitas (Seri 8300)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_ga)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-purple-700">
                        <span>Komisi EDC Bank & Merchant Discount Rate (MDR - Akun 8300.04.01)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_card_comm)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Beban Penyusutan Aset Tetap & Amortisasi (Seri 8400)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_depreciation)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Biaya Manajemen Holding MRA (Holding Fee - Seri 9000)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_mgmt_fee)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Beban Operasional Lainnya (Seri 8000)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.opex_other)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2.5 bg-amber-50/70 text-amber-950 font-bold border-y border-amber-200">
                        <span>TOTAL BEBAN OPERASIONAL (TOTAL OPEX)</span>
                        <span className="font-mono">{formatIDR(financialData.pl.total_opex)}</span>
                      </div>

                      {/* LABA USAHA / EBIT */}
                      <div className="flex justify-between items-center px-4 py-3 bg-indigo-50 text-indigo-950 font-bold border-y border-indigo-200">
                        <div className="flex items-center space-x-2">
                          <span>LABA USAHA / OPERATING PROFIT (EBIT)</span>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-200 text-indigo-900 font-semibold">
                            EBIT Margin: {financialData.pl.ebit_margin.toFixed(1)}%
                          </span>
                        </div>
                        <span className={`font-mono text-sm ${financialData.pl.ebit >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                          {formatIDR(financialData.pl.ebit)}
                        </span>
                      </div>

                      {/* IV. PENDAPATAN & BEBAN LAIN */}
                      <div className="bg-slate-50/80 px-4 py-2 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        IV. PENDAPATAN / (BEBAN) LAIN-LAIN
                      </div>
                      <div className="flex justify-between px-6 py-2.5 hover:bg-slate-50 text-slate-700">
                        <span>Pendapatan / (Beban) Lain-lain Bersih (Bunga, Kurs, Pajak - Seri 8500)</span>
                        <span className="font-mono font-semibold">{formatIDR(financialData.pl.other_income_exp)}</span>
                      </div>

                      {/* LABA BERSIH SEBELUM PAJAK (NPBT) */}
                      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white font-bold text-sm">
                        <div>
                          <div className="text-emerald-400 text-xs font-semibold">BOTTOM LINE PROFITABILITY</div>
                          <span className="text-base">LABA BERSIH SEBELUM PAJAK (NPBT)</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono text-xl ${financialData.pl.npbt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatIDR(financialData.pl.npbt)}
                          </span>
                          <div className="text-xs text-slate-300">
                            Net Margin: {financialData.pl.npbt_margin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: BALANCE SHEET (NERACA) */}
              {financialSubTab === 'bs' && financialData && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">NERACA KEUANGAN (BALANCE SHEET STATEMENT)</h4>
                      <p className="text-xs text-slate-500">Posisi Per Akhir Tahun {financialYear === 'ALL' ? 'Terakhir' : financialYear} • Berdasarkan Buku Besar Häagen-Dazs</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                      Saldo Terverifikasi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SISI KIRI: AKTIVA (ASSETS) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-blue-600 text-white px-5 py-3 font-bold text-sm flex items-center justify-between">
                        <span>AKTIVA (ASSETS)</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-normal">Seri 1000</span>
                      </div>
                      <div className="p-4 space-y-3 text-xs">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-700 font-medium">Kas & Setara Kas / Bank (Petty Cash Cafe & Bank)</span>
                          <span className="font-mono font-bold text-slate-900">{formatIDR(financialData.balanceSheet.cash_bank)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-700 font-medium">Piutang Usaha & Persediaan (Stock Es Krim & Bahan)</span>
                          <span className="font-mono font-bold text-slate-900">{formatIDR(financialData.balanceSheet.receivables_inventory)}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-blue-50/70 px-3 rounded-xl font-bold text-blue-950 text-sm mt-4">
                          <span>TOTAL AKTIVA (TOTAL ASSETS)</span>
                          <span className="font-mono">{formatIDR(financialData.balanceSheet.total_assets)}</span>
                        </div>
                      </div>
                    </div>

                    {/* SISI KANAN: KEWAJIBAN & EKUITAS (LIABILITIES & EQUITY) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-purple-700 text-white px-5 py-3 font-bold text-sm flex items-center justify-between">
                        <span>KEWAJIBAN & EKUITAS (LIABILITIES & EQUITY)</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-normal">Seri 2000 & 3000</span>
                      </div>
                      <div className="p-4 space-y-3 text-xs">
                        <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">A. Kewajiban (Liabilities)</div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 pl-2">
                          <span className="text-slate-700 font-medium">Hutang Usaha / Accounts Payable (Seri 2100)</span>
                          <span className="font-mono font-bold text-slate-900">{formatIDR(financialData.balanceSheet.liabilities_ap)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 pl-2">
                          <span className="text-slate-700 font-medium">Hutang Pajak & Beban Akrual Lainnya</span>
                          <span className="font-mono font-bold text-slate-900">{formatIDR(financialData.balanceSheet.liabilities_other)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-slate-50 px-3 rounded-lg font-bold text-slate-800">
                          <span>Total Kewajiban</span>
                          <span className="font-mono">{formatIDR(financialData.balanceSheet.total_liabilities)}</span>
                        </div>

                        <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider pt-2">B. Ekuitas (Equity)</div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100 pl-2">
                          <span className="text-slate-700 font-medium">Modal Saham & Laba Ditahan (Seri 3100)</span>
                          <span className="font-mono font-bold text-slate-900">{formatIDR(financialData.balanceSheet.equity)}</span>
                        </div>

                        <div className="flex justify-between py-3 bg-purple-50/70 px-3 rounded-xl font-bold text-purple-950 text-sm mt-4">
                          <span>TOTAL KEWAJIBAN & EKUITAS</span>
                          <span className="font-mono">{formatIDR(financialData.balanceSheet.total_liabilities_and_equity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: TREN BULANAN & MARGIN */}
              {financialSubTab === 'trend' && financialData && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">TREN KINERJA KEUANGAN BULANAN (JAN - DES {financialYear})</h4>
                      <p className="text-xs text-slate-500">Pergerakan Penjualan Bersih, HPP, Laba Kotor, dan Beban Operasional</p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{financialData.monthlyTrend.length} Bulan Terdata</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-3 px-4">Periode Bulan</th>
                          <th className="py-3 px-4 text-right">Penjualan Bersih (Net)</th>
                          <th className="py-3 px-4 text-right">HPP (COGS)</th>
                          <th className="py-3 px-4 text-right">Laba Kotor (GP)</th>
                          <th className="py-3 px-4 text-center">Margin GP %</th>
                          <th className="py-3 px-4 text-right">Beban OPEX</th>
                          <th className="py-3 px-4 text-right">Laba Usaha (EBIT)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financialData.monthlyTrend.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">📅 {m.period_ym}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatIDR(m.net_revenue)}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-rose-700">{formatIDR(m.cogs)}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">{formatIDR(m.gross_profit)}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {m.gp_margin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-amber-700">{formatIDR(m.opex)}</td>
                            <td className={`py-2.5 px-4 text-right font-mono font-bold ${m.ebit >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                              {formatIDR(m.ebit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: TRIAL BALANCE AKUN LENGKAP */}
              {financialSubTab === 'tb' && financialData && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={tbSearch}
                          onChange={(e) => setTbSearch(e.target.value)}
                          placeholder="Cari kode akun atau nama akun..."
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {['', '1100', '1200', '2100', '4100', '5000', '7000', '8100', '8200', '8300', '8400', '8500', '9000'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setTbSeriesFilter(s)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            tbSeriesFilter === s
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {s === '' ? 'Semua Seri' : `Seri ${s}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-3 px-3">Kode Akun</th>
                          <th className="py-3 px-3">Nama Akun</th>
                          <th className="py-3 px-3">Kategori</th>
                          <th className="py-3 px-3 text-right">Saldo Awal</th>
                          <th className="py-3 px-3 text-right">Mutasi Debet</th>
                          <th className="py-3 px-3 text-right">Mutasi Kredit</th>
                          <th className="py-3 px-3 text-right">Saldo Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financialData.trialBalanceAccounts
                          .filter((a: any) => {
                            const matchSearch = !tbSearch || 
                              a.account_code.toLowerCase().includes(tbSearch.toLowerCase()) ||
                              a.account_name.toLowerCase().includes(tbSearch.toLowerCase());
                            const matchSeries = !tbSeriesFilter || a.account_series === tbSeriesFilter;
                            return matchSearch && matchSeries;
                          })
                          .slice(0, 100)
                          .map((a: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{a.account_code}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{a.account_name}</td>
                              <td className="py-2 px-3 text-slate-500">{a.account_category}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600">{formatIDR(a.beginning)}</td>
                              <td className="py-2 px-3 text-right font-mono text-blue-700">{formatIDR(a.debet)}</td>
                              <td className="py-2 px-3 text-right font-mono text-amber-700">{formatIDR(a.credit)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(a.ending)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILES & MULTI-YEAR FOLDER MANAGER */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-base">Folder Penyimpanan File Per Tahun (2018 - 2025)</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                    Folder khusus per tahun telah dibuat di <code className="text-emerald-300 font-mono">D:\MRA Project\DATA POS EMERALD\&lt;TAHUN&gt;</code>. Anda dapat menyalin file Excel 2018–2023 ke dalam folder masing-masing, lalu klik tombol sinkronisasi.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleRunImport(false)}
                    disabled={importing || uploading}
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{importing ? 'Memproses Seluruh File...' : '⚡ Scan & Sync Semua Tahun'}</span>
                  </button>
                </div>
              </div>

              {/* Year Folders Grid (2018 - 2025) */}
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Status Folder Tahun (Silakan Copy File ke Folder di Bawah)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {folders.map((fld) => (
                    <div 
                      key={fld.year}
                      className={`p-4 rounded-xl border transition-all ${
                        fld.fileCount > 0 
                          ? 'bg-white border-emerald-300 shadow-sm hover:shadow-md' 
                          : 'bg-slate-50 border-slate-200/80 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className={`w-4 h-4 ${fld.fileCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-slate-900 text-sm">Tahun {fld.year}</span>
                        </div>
                        {fld.isComplete ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">100% Diimpor</span>
                        ) : fld.fileCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{fld.importedCount}/{fld.fileCount} File</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-medium">Siap Dicopy</span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Total File Excel:</span>
                          <span className="font-bold text-slate-800">{fld.fileCount} file</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Baris di Database:</span>
                          <span className="font-bold text-slate-800">{fld.totalRows.toLocaleString()} baris</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Ukuran Folder:</span>
                          <span className="font-mono text-slate-700">{fld.sizeMb} MB</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate max-w-[160px]" title={fld.folderPath}>📁 ...\{fld.year}</span>
                        <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => handleRunImport(false)}>Sync</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>Upload File Excel Langsung dari Browser (Drag-and-Drop)</span>
                    </h4>
                    <p className="text-xs text-slate-500">Pilih atau tarik file `.xls` atau `.xlsx` dari tahun mana saja untuk langsung diimpor ke PostgreSQL.</p>
                  </div>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={handleUploadFiles}
                      disabled={uploading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center space-x-2 disabled:opacity-50"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Mengunggah & Memproses...' : `Unggah & Impor (${selectedFiles.length} File)`}</span>
                    </button>
                  )}
                </div>

                {/* Drop Zone Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                      : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">Tarik & Lepas File Excel ke Sini atau Klik untuk Memilih</h5>
                  <p className="text-[11px] text-slate-500 mt-1">Mendukung format file `.xls` (Excel 97-2003 BIFF8) dan `.xlsx`</p>
                </div>

                {/* Selected Files Preview List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>File Terpilih ({selectedFiles.length}):</span>
                      <button onClick={() => setSelectedFiles([])} className="text-rose-500 hover:text-rose-600 text-[11px]">Hapus Semua</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                          <div className="flex items-center space-x-2 truncate">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }} className="text-slate-400 hover:text-rose-500 p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Console Output if available */}
              {importOutput && (
                <div className="bg-slate-900 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                  <div className="flex justify-between items-center text-slate-400 mb-2 border-b border-slate-800 pb-1 font-sans text-[11px]">
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Output Eksekusi Ingestion Engine</span>
                    </span>
                    <button onClick={() => setImportOutput(null)} className="text-slate-400 hover:text-white">Tutup</button>
                  </div>
                  <pre className="whitespace-pre-wrap">{importOutput}</pre>
                </div>
              )}

              {/* Files Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800">Daftar File yang Telah Masuk di PostgreSQL ({files.length} File)</h4>
                  <button onClick={fetchFiles} className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Segarkan</span>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3">Nama File</th>
                        <th className="py-2.5 px-3">Batch Code</th>
                        <th className="py-2.5 px-3 text-right">Ukuran</th>
                        <th className="py-2.5 px-3 text-right">Total Baris</th>
                        <th className="py-2.5 px-3 text-right">Total Debet</th>
                        <th className="py-2.5 px-3 text-center">Durasi</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {files.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-semibold text-slate-900 flex items-center space-x-2">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[280px]" title={f.file_name}>{f.file_name}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">{f.batch_code}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {(Number(f.file_size) / (1024 * 1024)).toFixed(2)} MB
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            {Number(f.total_rows).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            {formatIDR(f.total_debet)}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono">
                            {f.duration_seconds ? `${Number(f.duration_seconds).toFixed(1)}s` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {f.status === 'COMPLETED' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>COMPLETED</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                {f.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTIONS EXPLORER */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
                <div className="flex-1 min-w-[240px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari produk es krim, no transaksi, atau notes..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
                  >
                    <option value="">Semua Tipe Transaksi</option>
                    <option value="POSSTOCK_REGULAR">POSSTOCK (Produk Jadi)</option>
                    <option value="POSSTOCK_COND">POSSTOCK/COND (BOM/Bahan)</option>
                    <option value="SALES_INVOICE_SI">Sales Invoice (SI)</option>
                    <option value="STOCK_TRANSFER_ST">Stock Transfer (ST)</option>
                    <option value="CREDIT_CARD_COMMISSION">Komisi EDC (MDR)</option>
                  </select>

                  <select
                    value={selectedLocation}
                    onChange={(e) => { setSelectedLocation(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 max-w-[200px]"
                  >
                    <option value="">Semua Outlet</option>
                    {stats?.topOutlets?.map((o: any, idx: number) => (
                      <option key={idx} value={o.location_name}>{o.location_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3">No Transaksi</th>
                        <th className="py-3 px-3">Tipe</th>
                        <th className="py-3 px-3">Nama Produk / Item</th>
                        <th className="py-3 px-3 text-center">Qty</th>
                        <th className="py-3 px-3">Outlet / Toko</th>
                        <th className="py-3 px-3 text-right">Debet (IDR)</th>
                        <th className="py-3 px-3">Akun COA</th>
                        <th className="py-3 px-3">File Sumber</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trxLoading ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                            Memuat data transaksi...
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            Tidak ada transaksi yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((trx) => (
                          <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                              {trx.trx_date ? new Date(trx.trx_date).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{trx.trx_no || '-'}</td>
                            <td className="py-2.5 px-3">{getTrxTypeBadge(trx.trx_type)}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[220px] truncate" title={trx.description}>
                              {trx.item_name || trx.description}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">{trx.quantity}</td>
                            <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{trx.location_name || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {formatIDR(trx.debet)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {trx.account_code}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-[140px]" title={trx.source_file}>
                              {trx.source_file}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    Menampilkan baris {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari total <strong>{pagination.total.toLocaleString()}</strong> transaksi
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || trxLoading}
                      className="p-1.5 border border-slate-300 rounded hover:bg-slate-200 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold">Hal {pagination.page} / {pagination.totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages || trxLoading}
                      className="p-1.5 border border-slate-300 rounded hover:bg-slate-200 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OUTLETS ANALYTICS */}
          {activeTab === 'outlets' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Cari nama outlet, mall, atau kota..."
                  value={outletFilter}
                  onChange={(e) => setOutletFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 font-medium">Total 116 Cabang Häagen-Dazs</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-3">Nama Outlet</th>
                      <th className="py-3 px-3">Format Toko</th>
                      <th className="py-3 px-3">Kota</th>
                      <th className="py-3 px-3 text-right">Total Transaksi</th>
                      <th className="py-3 px-3 text-right">Total HPP Es Krim (COGS)</th>
                      <th className="py-3 px-3 text-right">Diskon Kasir (SI)</th>
                      <th className="py-3 px-3 text-right">Komisi EDC Bank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outlets
                      .filter((o) => 
                        o.location_name.toLowerCase().includes(outletFilter.toLowerCase()) ||
                        (o.city && o.city.toLowerCase().includes(outletFilter.toLowerCase()))
                      )
                      .map((o, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{o.location_name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {o.outlet_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{o.city}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{Number(o.total_trx).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-700">{formatIDR(o.total_cogs)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatIDR(o.total_sales_discount)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-700">{formatIDR(o.total_card_comm)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CHART OF ACCOUNTS */}
          {activeTab === 'coa' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex gap-2">
                  {['', '1100', '1200', '1500', '2100', '4100', '5000', '7000', '8100', '8300', '8400', '9000'].map((series) => (
                    <button
                      key={series}
                      onClick={() => setCoaSeriesFilter(series)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        coaSeriesFilter === series
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {series === '' ? 'Semua Seri' : `Seri ${series}`}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">Total 646 Akun Master COA</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-3">Kode Akun</th>
                      <th className="py-3 px-3">Nama Akun</th>
                      <th className="py-3 px-3">Kategori Akuntansi</th>
                      <th className="py-3 px-3 text-right">Jumlah Transaksi</th>
                      <th className="py-3 px-3 text-right">Total Debet</th>
                      <th className="py-3 px-3 text-right">Total Kredit</th>
                      <th className="py-3 px-3 text-right">Total Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coas
                      .filter((c) => !coaSeriesFilter || c.account_series === coaSeriesFilter)
                      .map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.account_code}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{c.account_name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{c.account_category}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">{Number(c.total_trx).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatIDR(c.total_debet)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatIDR(c.total_credit)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(c.total_net)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
