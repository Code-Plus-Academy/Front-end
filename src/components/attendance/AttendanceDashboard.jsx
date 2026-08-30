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
  Calendar,
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  CheckSquare,
  Square,
  UserCheck,
  BarChart3,
  Layers,
  X
} from 'lucide-react';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

export default function AttendanceDashboard({ initialTab = 'attendance' }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Sub-modules: 'attendance' | 'portal' | 'submissions' | 'test'
  const normalizedInitialTab = initialTab === 'payment' ? 'portal' : initialTab;
  const [activeModule, setActiveModule] = useState(normalizedInitialTab || 'attendance');
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form Submissions date state
  const [selectedSubmissionsDate, setSelectedSubmissionsDate] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('all');

  // Student Portal State (Multi-Student Isolation)
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedPortalMonth, setSelectedPortalMonth] = useState('August');
  const [portalViewMode, setPortalViewMode] = useState('cards'); // 'cards' | 'comparison'
  const [portalTierFilter, setPortalTierFilter] = useState('all');

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
      if (moduleName === 'portal' || moduleName === 'payment' || moduleName === 'student_portal') {
        // Fetch live master attendance sheet & submissions sheet in parallel
        const [attRes, subRes] = await Promise.allSettled([
          api.get('/notes/sheets/attendance'),
          api.get('/notes/sheets/submissions')
        ]);

        const attData = attRes.status === 'fulfilled' ? attRes.value?.data?.data : null;
        const subData = subRes.status === 'fulfilled' ? subRes.value?.data?.data : null;

        const rawRecords = attData?.records || [];
        const dates = attData?.dates || subData?.dates || [];
        const submissions = subData?.records || [];

        setModuleData({
          records: rawRecords,
          dates: dates,
          month: attData?.month || 'August 2026',
          submissions: submissions,
        });
        setLastUpdated((attRes.status === 'fulfilled' && attRes.value?.data?.last_updated) || new Date().toISOString());
        return;
      }

      const res = await api.get(`/notes/sheets/${moduleName}`);
      const data = res?.data?.data || null;
      setModuleData(data);
      setLastUpdated(res?.data?.last_updated || new Date().toISOString());

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
    { id: 'portal', label: 'Student Portal', icon: GraduationCap, desc: 'Multi-student result & performance scorecards' },
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
              2. TAB: STUDENT PORTAL (REDESIGNED STUDENT PAY & ATTENDANCE HUB)
          ══════════════════════════════════════════════════ */}
          {(activeModule === 'portal' || activeModule === 'payment') && (() => {
            const rawRecords = moduleData?.records || [];
            const dates = moduleData?.dates || [];
            const submissions = moduleData?.submissions || [];
            const sheetMonth = moduleData?.month || 'August 2026';
            const availableMonths = [sheetMonth, 'August 2026', 'July 2026', 'June 2026', 'May 2026', 'April 2026'].filter((v, i, a) => a.indexOf(v) === i);

            // Time window calculation: 8:00 AM to 4:00 PM (IST)
            const now = new Date();
            const currentHour = now.getHours();
            const isAttendanceWindowActive = currentHour >= 8 && currentHour < 16;

            // Enrich student list strictly from live Google Sheet records
            const normalizedStudents = rawRecords.map((r, idx) => {
              const id = String(r.id || r.roll_no || r.roll || idx + 1);
              const name = (r.name || r.student_name || `Student #${id}`).trim();
              const dept = (r.department || r.class || r.course || 'General').trim();
              const displayName = `${id} ${name} (${dept})`;
              
              let rate = 0;
              if (r.attendance_rate !== undefined && r.attendance_rate !== null) {
                rate = Number(r.attendance_rate);
              } else if (r.days_attended !== undefined && dates.length > 0) {
                rate = Math.round((Number(r.days_attended) / dates.length) * 100);
              } else if (r.monthly_absences !== undefined && dates.length > 0) {
                rate = Math.max(0, Math.round(((dates.length - Number(r.monthly_absences)) / dates.length) * 100));
              } else if (r.status) {
                rate = (r.status || '').toLowerCase().includes('present') ? 100 : 0;
              } else {
                rate = 0;
              }

              return {
                id,
                name,
                department: dept,
                displayName,
                rate,
                raw: r
              };
            });

            // If no student records in sheet, render graceful empty state
            if (normalizedStudents.length === 0) {
              return (
                <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <Users size={24} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    No Student Records Loaded
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Could not find student records in the attendance master sheet. Click "Sync Live Sheet" to reload or check your Google Sheet connection.
                  </p>
                  <button
                    onClick={() => fetchModuleData('portal', true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>Sync Live Sheet</span>
                  </button>
                </div>
              );
            }

            // Default to first student if selected student not set
            const activeStudentId = selectedStudentIds[0] || normalizedStudents[0].id;
            const activeStudent = normalizedStudents.find(s => s.id === activeStudentId) || normalizedStudents[0];

            // Build detailed session ledger for the selected student from live records & submissions
            const studentDailyMap = activeStudent.raw?.daily_status || {};
            
            // Collect all unique dates from master dates array, student's daily_status keys, or submissions
            const rawDatesList = (dates && dates.length > 0)
              ? dates
              : Object.keys(studentDailyMap).length > 0
                ? Object.keys(studentDailyMap)
                : submissions.map(s => (s.date_of_attendance || '').trim()).filter(Boolean);

            const distinctDates = Array.from(new Set(rawDatesList)).filter(Boolean);

            // Filter submissions specifically belonging to this active student
            const studentSubmissions = submissions.filter(s => {
              const subName = (s.student_name || '').toLowerCase().trim();
              const actName = (activeStudent.name || '').toLowerCase().trim();
              const subId = String(s.student_id || s.roll_no || '').trim();
              return (subId && subId === activeStudent.id) || (subName && (subName === actName || subName.includes(actName) || actName.includes(subName)));
            });

            // Map each date to a structured ledger entry
            const ledgerRows = distinctDates.map(d => {
              const rawStatus = (studentDailyMap[d] || '').toLowerCase().trim();
              const matchingSub = studentSubmissions.find(s => (s.date_of_attendance || '').trim() === d.trim());

              const isPresent = rawStatus.includes('present') || rawStatus === 'p' || rawStatus === '1' || matchingSub?.ai_status === 'VALID';
              const isFlagged = rawStatus.includes('flagged') || rawStatus.includes('invalid') || matchingSub?.ai_status === 'FLAGGED';

              const statusLabel = isPresent ? 'Present' : 'Absent';
              const validityLabel = isPresent ? 'valid' : isFlagged ? 'invalid' : '-';
              const explanationText = matchingSub?.ai_explanation || (isPresent ? 'Submitted on same day.' : isFlagged ? 'Flagged by AI.' : '-');
              const imageLink = matchingSub?.image_url || matchingSub?.drive_url || matchingSub?.photo_link || null;
              const deptLabel = matchingSub?.department || (isPresent ? activeStudent.department : '-');

              return {
                date: d,
                department: deptLabel,
                status: statusLabel,
                validity: validityLabel,
                explanation: explanationText,
                image_link: imageLink
              };
            });

            // Summary metrics
            const totalDays = ledgerRows.length > 0 ? ledgerRows.length : dates.length;
            const daysPresent = ledgerRows.filter(r => r.status === 'Present').length;
            const daysAbsent = ledgerRows.filter(r => r.status === 'Absent').length;
            const invalidEntries = ledgerRows.filter(r => r.validity === 'invalid').length;
            const dailyRate = 65;
            const estimatedPay = daysPresent * dailyRate;
            const formattedPay = `₹${estimatedPay.toFixed(2)}`;

            // Cumulative income data points for SVG line chart
            let runningTotal = 0;
            const cumulativeData = ledgerRows.map((r) => {
              if (r.status === 'Present' && r.validity === 'valid') {
                runningTotal += dailyRate;
              }
              const shortDate = r.date.split('/').slice(0, 2).join('/');
              return {
                date: shortDate,
                fullDate: r.date,
                cumulativePay: runningTotal,
                status: r.status
              };
            });

            // Department frequency map for pie chart
            const deptCountMap = {};
            ledgerRows.forEach(r => {
              if (r.status === 'Present' && r.department && r.department !== '-') {
                deptCountMap[r.department] = (deptCountMap[r.department] || 0) + 1;
              }
            });
            if (Object.keys(deptCountMap).length === 0 && daysPresent > 0) {
              deptCountMap[activeStudent.department || 'General'] = daysPresent;
            }

            const deptColors = ['#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];
            const deptEntries = Object.entries(deptCountMap);
            const totalDeptCount = deptEntries.reduce((acc, [, c]) => acc + c, 0);

            return (
              <div className="space-y-4">
                {/* ── 1. ACTIVE ATTENDANCE TIME WINDOW (8:00 AM - 4:00 PM) BANNER ── */}
                <div className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition ${
                  isAttendanceWindowActive
                    ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:via-[#132A24] dark:to-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                    : 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 dark:from-blue-950/40 dark:via-[#161E36] dark:to-blue-950/40 border-blue-200 dark:border-blue-800/60 shadow-xs'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${
                      isAttendanceWindowActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          Daily Attendance Window (8:00 AM – 4:00 PM)
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isAttendanceWindowActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        }`}>
                          {isAttendanceWindowActive ? 'Active Session Live' : 'View & Audit Mode'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                        Students place their daily attendance proofs during 8:00 AM – 4:00 PM. Changes sync live to this portal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => fetchModuleData('portal', true)}
                      disabled={refreshing}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2337] border border-gray-200 dark:border-gray-700 hover:border-purple-400 text-xs font-bold text-gray-700 dark:text-gray-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <RefreshCw size={12} className={refreshing ? 'animate-spin text-purple-600' : 'text-gray-500'} />
                      <span>{refreshing ? 'Syncing...' : 'Sync Live Sheet'}</span>
                    </button>
                  </div>
                </div>

                {/* ── 2. TOP FILTER & CONTEXT HEADER (MATCHING REDESIGN) ── */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-600/25 flex-shrink-0">
                        <GraduationCap size={22} />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                          Student Pay & Attendance Portal
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          View your attendance and payment details at a glance.
                        </p>
                      </div>
                    </div>

                    {/* View Switcher: Single Student Redesign vs Comparison Matrix */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#121624] p-1 rounded-xl border border-gray-200 dark:border-gray-800 self-end sm:self-auto">
                      <button
                        onClick={() => setPortalViewMode('cards')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          portalViewMode === 'cards'
                            ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Layers size={13} />
                        <span>Portal View</span>
                      </button>
                      <button
                        onClick={() => setPortalViewMode('comparison')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          portalViewMode === 'comparison'
                            ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <BarChart3 size={13} />
                        <span>Multi-Student Matrix</span>
                      </button>
                    </div>
                  </div>

                  {/* Dropdowns & Header Quick Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {/* Student Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <User size={12} className="text-purple-600" />
                        <span>Select Student:</span>
                      </label>
                      <div className="relative">
                        <select
                          value={activeStudentId}
                          onChange={(e) => setSelectedStudentIds([e.target.value])}
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#1F2438] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
                        >
                          {normalizedStudents.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.displayName}
                            </option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* Month Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar size={12} className="text-purple-600" />
                        <span>Select Month:</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPortalMonth}
                          onChange={(e) => setSelectedPortalMonth(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#1F2438] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
                        >
                          {availableMonths.map(m => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* Quick Metric 1: Days Present */}
                    <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Days Present</div>
                        <div className="text-lg font-black text-purple-950 dark:text-white leading-tight">
                          {daysPresent}
                        </div>
                      </div>
                    </div>

                    {/* Quick Metric 2: Estimated Pay */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <IndianRupee size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Estimated Pay</div>
                        <div className="text-lg font-black text-emerald-950 dark:text-white leading-tight">
                          {formattedPay}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {portalViewMode === 'cards' ? (
                  <>
                    {/* ── 3. ATTENDANCE DETAILS TABLE (MATCHING REDESIGN) ── */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-purple-600" />
                          <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                            Attendance Details
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500">
                          Showing {ledgerRows.length} sessions in {selectedPortalMonth}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-[#1E2337] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-black tracking-wider">
                              <th className="py-3 px-3.5">Date</th>
                              <th className="py-3 px-3.5">Department</th>
                              <th className="py-3 px-3.5">Status</th>
                              <th className="py-3 px-3.5">Validity</th>
                              <th className="py-3 px-3.5">Validity Explanation</th>
                              <th className="py-3 px-3.5 text-right">Image Link</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                            {ledgerRows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                                  No attendance records recorded for this student in {selectedPortalMonth}.
                                </td>
                              </tr>
                            ) : (
                              ledgerRows.map((row, idx) => {
                                const isPresent = row.status === 'Present';
                                const isInvalid = row.validity === 'invalid';

                                return (
                                  <tr
                                    key={idx}
                                    className={`transition duration-150 ${
                                      isInvalid
                                        ? 'bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-950/50'
                                        : 'hover:bg-purple-50/30 dark:hover:bg-purple-900/15'
                                    }`}
                                  >
                                    {/* Date */}
                                    <td className="py-3 px-3.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                      {row.date}
                                    </td>

                                    {/* Department */}
                                    <td className="py-3 px-3.5 font-medium text-gray-700 dark:text-gray-300">
                                      {row.department}
                                    </td>

                                    {/* Status */}
                                    <td className="py-3 px-3.5 whitespace-nowrap">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-black inline-flex items-center gap-1 ${
                                          isPresent
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                                        }`}
                                      >
                                        {row.status}
                                      </span>
                                    </td>

                                    {/* Validity */}
                                    <td className="py-3 px-3.5 whitespace-nowrap">
                                      {row.validity === 'valid' ? (
                                        <div className="flex items-center gap-1">
                                          <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-0.5">
                                            <span>Valid</span>
                                            <CheckCircle size={10} />
                                          </span>
                                          <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-0.5">
                                            <span>Valid</span>
                                            <CheckCircle size={10} />
                                          </span>
                                        </div>
                                      ) : row.validity === 'invalid' ? (
                                        <div className="flex items-center gap-1">
                                          <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 flex items-center gap-0.5">
                                            <span>Invalid</span>
                                            <XCircle size={10} />
                                          </span>
                                          <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 flex items-center gap-0.5">
                                            <span>Invalid</span>
                                            <XCircle size={10} />
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 font-bold">-</span>
                                      )}
                                    </td>

                                    {/* Validity Explanation */}
                                    <td className="py-3 px-3.5 text-gray-700 dark:text-gray-300 text-[11px] font-medium">
                                      {row.explanation}
                                    </td>

                                    {/* Image Link */}
                                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                      {row.image_link ? (
                                        <a
                                          href={row.image_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                                        >
                                          <span>View Link</span>
                                          <ExternalLink size={11} />
                                        </a>
                                      ) : (
                                        <span className="text-gray-400 font-medium text-[11px]">No Link</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── 4. ANALYTICS & CHARTS SECTION (3-COLUMN DESKTOP / STACKED MOBILE) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* ── CHART 1: CUMULATIVE INCOME (50% / 6 COLS ON DESKTOP) ── */}
                      <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-600" />
                            <h3 className="text-sm font-black text-gray-900 dark:text-white">Cumulative Income</h3>
                          </div>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                            Total {formattedPay}
                          </span>
                        </div>

                        {/* Responsive SVG Stepped/Spline Line Chart */}
                        <div className="w-full h-56 relative flex items-center justify-center">
                          <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Y-Axis Grid Lines */}
                            {[0, 200, 400, 600, 800].map((val, idx) => {
                              const y = 180 - (val / 800) * 150;
                              return (
                                <g key={val}>
                                  <line x1="45" y1={y} x2="480" y2={y} stroke={isDark ? '#262D42' : '#E2E8F0'} strokeDasharray="3 3" />
                                  <text x="5" y={y + 3} fill={isDark ? '#8E99B4' : '#64748B'} fontSize="9" fontWeight="bold">
                                    ₹{val}.00
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area & Line Path */}
                            {(() => {
                              if (cumulativeData.length < 2) return null;
                              const points = cumulativeData.map((d, i) => {
                                const x = 50 + (i / (cumulativeData.length - 1)) * 420;
                                const y = 180 - (Math.min(800, d.cumulativePay) / 800) * 150;
                                return { x, y, ...d };
                              });

                              const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                              const areaD = `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                              return (
                                <g>
                                  <path d={areaD} fill="url(#incomeAreaGrad)" />
                                  <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                                  {points.map((p, idx) => (
                                    <g key={idx} className="group cursor-pointer">
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="3.5"
                                        fill="#3B82F6"
                                        stroke={isDark ? '#171B2B' : '#FFFFFF'}
                                        strokeWidth="1.5"
                                      />
                                      {/* Node hover pulse */}
                                      <circle cx={p.x} cy={p.y} r="7" fill="#3B82F6" opacity="0" className="hover:opacity-25 transition" />
                                    </g>
                                  ))}
                                </g>
                              );
                            })()}

                            {/* X-Axis Date Labels */}
                            {cumulativeData.map((d, i) => {
                              // Render every 2nd or 3rd label to avoid crowding
                              if (i % 2 !== 0 && i !== cumulativeData.length - 1) return null;
                              const x = 50 + (i / (cumulativeData.length - 1)) * 420;
                              return (
                                <text key={i} x={x} y="202" fill={isDark ? '#8E99B4' : '#64748B'} fontSize="9" fontWeight="bold" textAnchor="middle">
                                  {d.date}
                                </text>
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      {/* ── CHART 2: MONTHLY ATTENDANCE BREAKDOWN (DONUT CHART - 3 COLS) ── */}
                      <div className="lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-purple-600" />
                          <h3 className="text-sm font-black text-gray-900 dark:text-white">Monthly Attendance</h3>
                        </div>

                        {/* SVG Donut Chart with Center Text */}
                        <div className="relative w-36 h-36 mx-auto my-1 flex items-center justify-center">
                          {(() => {
                            const presentPct = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
                            const radius = 45;
                            const circumference = 2 * Math.PI * radius; // ~282.74
                            const presentOffset = circumference - (presentPct / 100) * circumference;

                            return (
                              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                {/* Background Circle (Absent Slice - Amber) */}
                                <circle
                                  cx="60"
                                  cy="60"
                                  r={radius}
                                  fill="none"
                                  stroke={totalDays > 0 && daysAbsent > 0 ? '#F59E0B' : (isDark ? '#262D42' : '#E2E8F0')}
                                  strokeWidth="18"
                                />
                                {/* Foreground Circle (Present Slice - Red/Coral) */}
                                {totalDays > 0 && daysPresent > 0 && (
                                  <circle
                                    cx="60"
                                    cy="60"
                                    r={radius}
                                    fill="none"
                                    stroke="#EF4444"
                                    strokeWidth="18"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={presentOffset}
                                    strokeLinecap="round"
                                  />
                                )}
                              </svg>
                            );
                          })()}

                          {/* Center Text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white leading-tight">
                              {totalDays} Days
                            </span>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs font-bold">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                              <span>Present ({daysPresent})</span>
                            </span>
                            <span className="text-gray-900 dark:text-white font-mono">
                              {totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                              <span>Absent ({daysAbsent})</span>
                            </span>
                            <span className="text-gray-900 dark:text-white font-mono">
                              {totalDays > 0 ? Math.round((daysAbsent / totalDays) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── CHART 3: DEPARTMENT DISTRIBUTION (PIE CHART - 3 COLS) ── */}
                      <div className="lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 size={16} className="text-purple-600" />
                          <h3 className="text-sm font-black text-gray-900 dark:text-white">Department Distribution</h3>
                        </div>

                        {/* Multi-Segment SVG Pie Chart */}
                        <div className="relative w-36 h-36 mx-auto my-1 flex items-center justify-center">
                          {totalDeptCount > 0 ? (
                            <svg viewBox="-60 -60 120 120" className="w-full h-full -rotate-90">
                              {(() => {
                                let accumulatedAngle = 0;
                                return deptEntries.map(([dName, count], idx) => {
                                  const slicePct = count / totalDeptCount;
                                  const sliceAngle = slicePct * 2 * Math.PI;
                                  const startAngle = accumulatedAngle;
                                  const endAngle = accumulatedAngle + sliceAngle;
                                  accumulatedAngle += sliceAngle;

                                  const x1 = 50 * Math.cos(startAngle);
                                  const y1 = 50 * Math.sin(startAngle);
                                  const x2 = 50 * Math.cos(endAngle);
                                  const y2 = 50 * Math.sin(endAngle);
                                  const largeArc = sliceAngle > Math.PI ? 1 : 0;
                                  const pathD = `M 0 0 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;

                                  return (
                                    <path
                                      key={dName}
                                      d={pathD}
                                      fill={deptColors[idx % deptColors.length]}
                                      stroke={isDark ? '#171B2B' : '#FFFFFF'}
                                      strokeWidth="1"
                                    />
                                  );
                                });
                              })()}
                            </svg>
                          ) : (
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-center p-2">
                              <span className="text-[10px] text-gray-400 font-bold">No sessions</span>
                            </div>
                          )}
                        </div>

                        {/* Multi-item Legend */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] font-bold">
                          {totalDeptCount > 0 ? (
                            deptEntries.slice(0, 6).map(([dName, count], idx) => {
                              const pct = Math.round((count / totalDeptCount) * 100);
                              return (
                                <div key={dName} className="flex items-center justify-between truncate">
                                  <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 truncate">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: deptColors[idx % deptColors.length] }} />
                                    <span className="truncate">{dName} ({count})</span>
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400 font-mono ml-1">{pct}%</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-2 text-center text-gray-400 text-[10px] py-1">
                              No department breakdown
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── 5. BOTTOM SUMMARY CARDS STRIP (MATCHING REDESIGN) ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Total Days */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <CalendarDays size={18} />
                        </div>
                        <div>
                          <div className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">Total Days</div>
                          <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                            {totalDays}
                          </div>
                        </div>
                      </div>

                      {/* Days Present */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#171B2B] border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <div className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">Days Present</div>
                          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                            {daysPresent}
                          </div>
                        </div>
                      </div>

                      {/* Days Absent */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#171B2B] border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <XCircle size={18} />
                        </div>
                        <div>
                          <div className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">Days Absent</div>
                          <div className="text-base sm:text-lg font-black text-red-600 dark:text-red-400 leading-tight">
                            {daysAbsent}
                          </div>
                        </div>
                      </div>

                      {/* Invalid Entries */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#171B2B] border border-amber-100 dark:border-amber-900/30 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <div className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">Invalid Entries</div>
                          <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 leading-tight">
                            {invalidEntries}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Full-width Estimated Pay Card Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                          <IndianRupee size={22} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                            Total Estimated Stipend Payout
                          </div>
                          <div className="text-xs text-blue-200">
                            Calculated for {activeStudent.name} • {daysPresent} Valid Present Sessions @ ₹{dailyRate}/day
                          </div>
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono">
                        {formattedPay}
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── MODE B: MULTI-STUDENT SPREADSHEET MATRIX (FOR COMPARISON) ── */
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#171B2B] border border-purple-100 dark:border-purple-900/30 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Multi-Student Comparison Matrix ({normalizedStudents.length} Students)
                      </h3>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-[#1F2438] border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase">
                            <th className="py-2.5 px-3">Roll</th>
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Class / Dept</th>
                            <th className="py-2.5 px-3 text-center">Attendance %</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {normalizedStudents.map(student => (
                            <tr key={student.id} className="hover:bg-purple-50/20 dark:hover:bg-purple-900/10">
                              <td className="py-2.5 px-3 font-mono font-bold text-gray-400">#{student.id}</td>
                              <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{student.name}</td>
                              <td className="py-2.5 px-3">{student.department}</td>
                              <td className="py-2.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                                {student.rate}%
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedStudentIds([student.id]);
                                    setPortalViewMode('cards');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-600 hover:text-white transition cursor-pointer"
                                >
                                  Open Portal ↗
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
