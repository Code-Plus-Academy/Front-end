'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CalendarDays,
  User,
  IndianRupee,
  ShieldCheck,
  FileSpreadsheet,
  Camera,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  Filter,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

export default function AttendanceDashboard({ initialTab = 'attendance' }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Sub-modules: 'attendance' | 'payment' | 'submissions' | 'test'
  const [activeModule, setActiveModule] = useState(initialTab || 'attendance');
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form Submissions date state
  const [selectedSubmissionsDate, setSelectedSubmissionsDate] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');

  // Common filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Format today's date in common formats (e.g., DD/MM/YYYY)
  const todayFormatted = useMemo(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return {
      standard: `${d}/${m}/${y}`, // 24/08/2026
      alt: `${now.getDate()}/${now.getMonth() + 1}/${y}`,
    };
  }, []);

  const fetchModuleData = useCallback(async (moduleName, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/notes/sheets/${moduleName}`);
      const data = res.data?.data || null;
      setModuleData(data);
      setLastUpdated(res.data?.last_updated || new Date().toISOString());

      // If fetching submissions, default to today's date or the latest available date
      if (moduleName === 'submissions' && data) {
        const availableDates = data.dates || [];
        if (!selectedSubmissionsDate) {
          if (availableDates.includes(todayFormatted.standard)) {
            setSelectedSubmissionsDate(todayFormatted.standard);
          } else if (availableDates.includes(todayFormatted.alt)) {
            setSelectedSubmissionsDate(todayFormatted.alt);
          } else if (data.latest_date) {
            setSelectedSubmissionsDate(data.latest_date);
          } else if (availableDates.length > 0) {
            setSelectedSubmissionsDate(availableDates[0]);
          }
        }
      }
    } catch (err) {
      console.warn(`[AttendanceDashboard] Fetch error on ${moduleName}:`, err.message);
      setError(err.response?.data?.message || 'Could not connect to live Google Sheet.');
      setModuleData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayFormatted, selectedSubmissionsDate]);

  useEffect(() => {
    fetchModuleData(activeModule);
  }, [activeModule, fetchModuleData]);

  const handleTabChange = (modId) => {
    setActiveModule(modId);
    setSearch('');
    setSelectedDept('all');
    setSelectedStatus('all');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', modId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('present') || s === 'p') {
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
        border: isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBF7D0',
        text: isDark ? '#4ADE80' : '#15803D',
        dot: '#22C55E',
        label: 'Present'
      };
    }
    if (s.includes('holiday') || s === 'h') {
      return {
        bg: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3',
        border: isDark ? 'rgba(234, 179, 8, 0.3)' : '#FEF08A',
        text: isDark ? '#FACC15' : '#A16207',
        dot: '#EAB308',
        label: 'Holiday'
      };
    }
    if (s.includes('duty') || s === 'od') {
      return {
        bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EDE9FE',
        border: isDark ? 'rgba(99, 102, 241, 0.3)' : '#DDD6FE',
        text: '#6366F1',
        dot: '#6366F1',
        label: 'On-Duty'
      };
    }
    return {
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
      text: isDark ? '#F87171' : '#B91C1C',
      dot: '#EF4444',
      label: status || 'Absent'
    };
  };

  // The 4 requested modules
  const moduleTabs = [
    { id: 'attendance', label: 'Attendance Matrix', icon: FileSpreadsheet, desc: 'Live roll call & daily statuses' },
    { id: 'payment', label: 'Payment Tracker', icon: IndianRupee, desc: 'Earn & Learn payouts & stipend budget' },
    { id: 'submissions', label: 'Form Submissions', icon: Camera, desc: 'Live punch-in proof photos & AI verification' },
    { id: 'test', label: 'Test Matrix', icon: CalendarDays, desc: 'Full-month attendance heatmap calendar' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-2.5 sm:px-4 py-3 sm:py-5 space-y-3 sm:space-y-4 font-sans text-gray-900 dark:text-gray-100">
      {/* ── TOP HEADER CARD ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 dark:from-[#171B2B] dark:via-[#131625] dark:to-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 flex-shrink-0">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold text-gray-950 dark:text-white leading-tight">
                  Attendance & Stipend Trackers
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Live Sync</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time data stream synced directly from official Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {lastUpdated && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock size={11} />
                <span>Synced {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            )}

            <button
              onClick={() => fetchModuleData(activeModule, true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#1E2337] border border-gray-200 dark:border-gray-700 hover:border-purple-400 text-gray-800 dark:text-gray-200 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* ── 4 TABS SELECTOR ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {moduleTabs.map((tab) => {
            const Icon = tab.icon;
            const isSel = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex-shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-white dark:bg-[#1A1F30] text-gray-600 dark:text-gray-400 border border-purple-100 dark:border-purple-900/30 hover:border-purple-400'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LOADING & ERROR STATES ── */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2.5">
          <RefreshCw size={24} className="animate-spin text-purple-600" />
          <span className="text-xs font-semibold text-gray-500">Connecting to live Google Sheets stream...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 flex items-center gap-3 text-red-600">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div>
            <div className="text-xs sm:text-sm font-bold">Google Sheets Notice</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{error}</div>
          </div>
        </div>
      ) : moduleData && (
        <>
          {/* ══════════════════════════════════════════════════
              1. TAB: ATTENDANCE MATRIX (LIVE ROLL CALL)
          ══════════════════════════════════════════════════ */}
          {activeModule === 'attendance' && (() => {
            const records = moduleData.records || [];
            const depts = Array.from(new Set(records.map(r => r.department).filter(Boolean)));

            const filtered = records.filter(r => {
              if (selectedDept !== 'all' && r.department !== selectedDept) return false;
              if (selectedStatus !== 'all' && (r.status || '').toLowerCase() !== selectedStatus.toLowerCase()) return false;
              if (search.trim()) {
                const q = search.toLowerCase().trim();
                return (r.name && r.name.toLowerCase().includes(q)) || (r.id && r.id.toLowerCase().includes(q));
              }
              return true;
            });

            const presentCount = records.filter(r => (r.status || '').toLowerCase() === 'present').length;
            const absentCount = records.filter(r => (r.status || '').toLowerCase() === 'absent').length;

            return (
              <div className="space-y-3.5">
                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Students</div>
                    <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{records.length}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Present Today</div>
                    <div className="text-lg sm:text-xl font-black text-green-600 dark:text-green-400 mt-0.5">{presentCount}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Absent Today</div>
                    <div className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 mt-0.5">{absentCount}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Month Session</div>
                    <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{moduleData.month || 'August'}</div>
                  </div>
                </div>

                {/* Filter Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search student name or roll..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {depts.length > 0 && (
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
                    >
                      <option value="all">All Classes ({depts.length})</option>
                      {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}

                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>

                {/* ── Mobile Compact Cards (<640px) ── */}
                <div className="block sm:hidden space-y-2">
                  {filtered.map((item, idx) => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20 flex flex-col gap-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono text-xs font-bold flex-shrink-0">
                              #{item.id}
                            </span>
                            <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                              {item.name}
                            </span>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                            style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.dot }}></span>
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100 dark:border-gray-800/80">
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold text-[10.5px]">
                            {item.department}
                          </span>
                          <span className={`font-bold ${Number(item.monthly_absences) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.monthly_absences} Absences
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop Table (>=640px) ── */}
                <div className="hidden sm:block rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-[#1F2438] border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-14">Roll</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Class / Dept</th>
                          <th className="py-2.5 px-3 text-center">Today's Status</th>
                          <th className="py-2.5 px-3 text-center">Monthly Absences</th>
                          <th className="py-2.5 px-3 text-right">Session Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filtered.map((item, idx) => {
                          const badge = getStatusBadge(item.status);
                          return (
                            <tr key={item.id || idx} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-gray-500">#{item.id}</td>
                              <td className="py-2 px-3 font-bold text-gray-900 dark:text-white">{item.name}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold text-[11px]">
                                  {item.department}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                                  style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.dot }}></span>
                                  <span>{badge.label}</span>
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center font-bold">
                                <span className={Number(item.monthly_absences) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                  {item.monthly_absences} Absences
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-gray-500 text-[11px] font-medium">
                                {item.date}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════
              2. TAB: PAYMENT TRACKER (STIPENDS & PAYOUTS)
          ══════════════════════════════════════════════════ */}
          {activeModule === 'payment' && (() => {
            const pay = moduleData || {};
            const records = pay.records || [];
            const depts = pay.departments || [];

            const filtered = records.filter(r => {
              if (selectedDept !== 'all' && r.department !== selectedDept) return false;
              if (search.trim()) {
                const q = search.toLowerCase().trim();
                return (r.name && r.name.toLowerCase().includes(q)) || (r.id && r.id.toLowerCase().includes(q));
              }
              return true;
            });

            return (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">Total Payout Budget</div>
                    <div className="text-lg sm:text-xl font-black text-green-600 dark:text-green-400 mt-0.5">{pay.total_payout || '₹23,595.00'}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">Daily Pay Rate</div>
                    <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{pay.daily_rate || '₹65.00'}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">Beneficiaries</div>
                    <div className="text-lg sm:text-xl font-black text-pink-600 dark:text-pink-400 mt-0.5">{records.length} Students</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">Billing Cycle</div>
                    <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{pay.month || 'August'}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student stipend..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {depts.length > 0 && (
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200"
                    >
                      <option value="all">All Participating Depts ({depts.length})</option>
                      {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-[#1F2438] border-b border-gray-200 dark:border-gray-800 text-gray-500 text-[11px] font-bold uppercase">
                          <th className="py-2.5 px-3 w-14">Roll</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Class</th>
                          <th className="py-2.5 px-3 text-center">Days Attended</th>
                          <th className="py-2.5 px-3 text-right">Earned Stipend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filtered.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-purple-50/20 dark:hover:bg-purple-900/10">
                            <td className="py-2 px-3 font-mono font-bold text-gray-400">#{item.id}</td>
                            <td className="py-2 px-3 font-bold text-gray-900 dark:text-white">{item.name}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold text-[11px]">
                                {item.department}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-gray-700 dark:text-gray-300">{item.days_attended} Days</td>
                            <td className="py-2 px-3 text-right font-extrabold text-green-600 dark:text-green-400 text-xs sm:text-sm">{item.estimated_payment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════
              3. TAB: FORM SUBMISSIONS (DATE-WISE FILTER & PROOFS)
          ══════════════════════════════════════════════════ */}
          {activeModule === 'submissions' && (() => {
            const allRecords = moduleData.records || [];
            const availableDates = moduleData.dates || [];

            // Determine active date filter (default is latest date or today)
            const activeDate = selectedSubmissionsDate || moduleData.latest_date || (availableDates[0] || 'all');

            // Count submissions per date for the dropdown options
            const dateCountMap = {};
            allRecords.forEach(r => {
              const d = (r.date_of_attendance || '').trim();
              if (d) dateCountMap[d] = (dateCountMap[d] || 0) + 1;
            });

            // Filter records by selected date
            const dateFiltered = allRecords.filter(r => {
              if (activeDate === 'all') return true;
              return (r.date_of_attendance || '').trim() === activeDate;
            });

            // Filter further by status and search
            const filteredSubmissions = dateFiltered.filter(sub => {
              if (submissionStatusFilter !== 'all') {
                if (sub.ai_status !== submissionStatusFilter) return false;
              }
              if (search.trim()) {
                const q = search.toLowerCase().trim();
                return (
                  (sub.student_name && sub.student_name.toLowerCase().includes(q)) ||
                  (sub.department && sub.department.toLowerCase().includes(q))
                );
              }
              return true;
            });

            const validCount = dateFiltered.filter(s => s.ai_status === 'VALID').length;
            const flaggedCount = dateFiltered.filter(s => s.ai_status === 'FLAGGED').length;

            return (
              <div className="space-y-3.5">
                {/* ── DATE SELECTOR HEADER CARD ── */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          Select Attendance Date:
                        </span>
                        {(activeDate === todayFormatted.standard || activeDate === todayFormatted.alt) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Date-wise verification & proof stream ({dateFiltered.length} records on {activeDate === 'all' ? 'All Dates' : activeDate})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={activeDate}
                      onChange={(e) => setSelectedSubmissionsDate(e.target.value)}
                      className="w-full sm:w-auto min-w-[200px] px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-900 dark:text-purple-200 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Dates ({allRecords.length} submissions)</option>
                      {availableDates.map((d) => (
                        <option key={d} value={d}>
                          {d} {(d === todayFormatted.standard || d === todayFormatted.alt) ? '• (Today)' : ''} ({dateCountMap[d] || 0} entries)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── DATE METRICS STRIP ── */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">Submissions on Date</div>
                    <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                      {dateFiltered.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">AI Validated</div>
                    <div className="text-lg sm:text-xl font-black text-green-600 dark:text-green-400 mt-0.5">
                      {validCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20">
                    <div className="text-[11px] text-gray-500 font-medium">Flagged / Review</div>
                    <div className="text-lg sm:text-xl font-black text-red-500 mt-0.5">
                      {flaggedCount}
                    </div>
                  </div>
                </div>

                {/* ── SEARCH & STATUS FILTERS ── */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student or department on this date..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <select
                    value={submissionStatusFilter}
                    onChange={e => setSubmissionStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Verification Statuses</option>
                    <option value="VALID">Valid Only ({validCount})</option>
                    <option value="FLAGGED">Flagged Only ({flaggedCount})</option>
                  </select>
                </div>

                {/* ── SUBMISSION CARDS GRID ── */}
                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#171B2B] border border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                    No submissions found for the selected date and filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {filteredSubmissions.map((sub, idx) => (
                      <div
                        key={sub.id || idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20 flex flex-col justify-between gap-2.5 shadow-sm"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md">
                              {sub.department}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${sub.ai_status === 'VALID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {sub.ai_status}
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{sub.student_name}</h5>
                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <CalendarDays size={11} />
                              <span>Date: <strong>{sub.date_of_attendance}</strong></span>
                            </span>
                            {sub.timestamp && (
                              <span className="text-[10px] text-gray-400 font-mono">{sub.timestamp}</span>
                            )}
                          </div>

                          {sub.ai_reason && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#1A1F30] p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                              {sub.ai_reason}
                            </p>
                          )}
                        </div>

                        {sub.proof_url && (
                          <a
                            href={sub.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100 transition"
                          >
                            <ExternalLink size={12} />
                            <span>View Uploaded Proof Photo</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══════════════════════════════════════════════════
              4. TAB: TEST MATRIX (HEATMAP CALENDAR)
          ══════════════════════════════════════════════════ */}
          {activeModule === 'test' && (() => {
            const records = moduleData.records || [];
            const dates = moduleData.dates || [];

            const filtered = records.filter(r => {
              if (search.trim()) {
                const q = search.toLowerCase().trim();
                return (r.name && r.name.toLowerCase().includes(q)) || (r.id && r.id.toLowerCase().includes(q));
              }
              return true;
            });

            return (
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      Full Month Attendance Heatmap ({moduleData.month || 'August'})
                    </h4>
                    <p className="text-[11px] text-gray-500">Day-by-day attendance grid across all active dates</p>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#171B2B] border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/20 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[480px] scrollbar-thin">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 z-20 bg-gray-100 dark:bg-[#1F2438]">
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          <th className="py-2 px-3 text-left min-w-[160px] sm:min-w-[190px] sticky left-0 z-30 bg-gray-100 dark:bg-[#1F2438]">
                            Student Name
                          </th>
                          <th className="py-2 px-1.5 text-center">Rate</th>
                          {dates.map((d) => (
                            <th key={d} className="py-2 px-1 text-center min-w-[24px] font-semibold text-[10.5px]">
                              {d.split('/')[1] || d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filtered.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-purple-50/20 dark:hover:bg-purple-900/10">
                            <td className="py-1.5 px-3 font-bold text-gray-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-[#171B2B]">
                              <span className="text-gray-400 font-mono text-[10.5px] mr-1">#{item.id}</span>
                              <span className="truncate">{item.name}</span>
                            </td>
                            <td className={`py-1.5 px-1.5 text-center font-extrabold ${item.attendance_rate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                              {item.attendance_rate}%
                            </td>
                            {dates.map((d) => {
                              const st = item.daily_status?.[d] || 'absent';
                              let cellBg = isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2';
                              let cellColor = '#EF4444';
                              let symbol = 'A';

                              if (st === 'present') {
                                cellBg = isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7';
                                cellColor = '#22C55E';
                                symbol = 'P';
                              } else if (st === 'holiday') {
                                cellBg = isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF9C3';
                                cellColor = '#EAB308';
                                symbol = 'H';
                              }

                              return (
                                <td key={d} className="py-1 px-1 text-center">
                                  <span
                                    title={`${d}: ${st}`}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded font-bold text-[10px]"
                                    style={{ background: cellBg, color: cellColor }}
                                  >
                                    {symbol}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
