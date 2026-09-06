import canonicalData from '../../data/canonicalAttendanceData.json';

/**
 * 42 Master Students Roster (SPPU SDO 2026-27)
 */
export const ROSTER_STUDENTS = [
  { id: '1', name: 'Khairnar Nikita Mothabhau', department: 'TYBCS' },
  { id: '2', name: 'Karande Madhuri Bhila', department: 'TYBCS' },
  { id: '3', name: 'Shubhangi Appa Bhamare', department: 'TYBCS' },
  { id: '4', name: 'Taskar Shital Dattatray', department: 'TYBCS' },
  { id: '5', name: 'Kaveri Banan Mogare', department: 'TYBA' },
  { id: '6', name: 'Deore Sakshi Bharat', department: 'SYBCS' },
  { id: '7', name: 'Gaikwad Gayatri Nivrutti', department: 'TYBCS' },
  { id: '8', name: 'Mansi Umesh Ahire', department: 'SYBCS' },
  { id: '9', name: 'Javare Payal Nivrutti', department: 'TYBA' },
  { id: '10', name: 'Pranali Kiran Kasav', department: 'TYBA' },
  { id: '11', name: 'Gangurde Nirzara Sukdev', department: 'TYBCS' },
  { id: '12', name: 'Javare Yogita Balu', department: 'TYBA' },
  { id: '13', name: 'Garud Prajakta Changdev', department: 'TYBSC' },
  { id: '14', name: 'Kshirsagar Prashant Dnyaneshwar', department: 'TYBCS' },
  { id: '15', name: 'Darade Ayush Dattu', department: 'TYBCS' },
  { id: '16', name: 'Bhandare Gaurav Sanjay', department: 'TYBCS' },
  { id: '17', name: 'Chikhale Tanvi Nilesh', department: 'TYBCS' },
  { id: '18', name: 'Takate Puja Baban', department: 'TYBCS' },
  { id: '19', name: 'Akanksha Shantaram Pacharne', department: 'TYBCS' },
  { id: '20', name: 'Agale Ganesh Bhausaheb', department: 'TYBCS' },
  { id: '21', name: 'More Akshay Rajendra', department: 'TYBA' },
  { id: '22', name: 'Shinde Neha Chandrakant', department: 'SYBSC' },
  { id: '23', name: 'Sonawane Sanika Sanjay', department: 'SYBSC' },
  { id: '24', name: 'Pansare Gayatri Manoj', department: 'SYBA' },
  { id: '25', name: 'Ajay Sanjay Wakade', department: 'SYBCS' },
  { id: '26', name: 'Priyanka Pravin Nirbhavane', department: 'TYBA' },
  { id: '27', name: 'Pallavi Uamaji Pawar', department: 'SYBSC' },
  { id: '28', name: 'Mahesh Arjun Bhalerao', department: 'SYBCOM' },
  { id: '29', name: 'Maya Shantaram Mali', department: 'TYBA' },
  { id: '30', name: 'Pawar Purva Sadashiv', department: 'TYBA' },
  { id: '31', name: 'Mogal sakshi Eknath', department: 'TYBSC' },
  { id: '32', name: 'Korde Vaishnavi Bhagava', department: 'SYBA' },
  { id: '33', name: 'Chopade Kunal Govind', department: 'TYBCS' },
  { id: '34', name: 'Pawar Rupali Sudhakar', department: 'TYBA' },
  { id: '35', name: 'Rutuja Ramesh Shinde', department: 'TYBSC' },
  { id: '36', name: 'Shinde Kaveri Sunil', department: 'SYBSC' },
  { id: '37', name: 'Shalini Sunil Gavale', department: 'SYBA' },
  { id: '38', name: 'Varsha Suresh Nirabhavane', department: 'SYBA' },
  { id: '39', name: 'Dipali Naransuravayshi', department: 'SYBA' },
  { id: '40', name: 'Pritesh Omprakash Sharma', department: 'SYBA' },
  { id: '41', name: 'Atharva Balasaheb Kapse', department: 'TYBCS' },
  { id: '42', name: 'Anarase Maya Bhaulal', department: 'TYBSC' },
].map(s => ({
  ...s,
  displayName: `#${s.id} ${s.name} (${s.department})`
}));

/**
 * 14 Distinct August Dates in sequence
 */
export const AUGUST_DATES = [
  '8/10/2026', '8/11/2026', '8/12/2026', '8/13/2026', '8/14/2026',
  '8/17/2026', '8/18/2026', '8/20/2026', '8/21/2026', '8/22/2026',
  '8/24/2026', '8/25/2026', '8/27/2026', '8/29/2026', '8/31/2026'
];

/**
 * 30 September Dates
 */
export const SEPTEMBER_DATES = Array.from({ length: 30 }, (_, i) => `9/${i + 1}/2026`);

/**
 * All Academic Term Months (August 2026 - February 2027)
 */
export const ACADEMIC_MONTHS = [
  'August 2026',
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027'
];

// Build Submissions Map by student ID
const studentSubmissionsMap = new Map();
const studentAugDatesMap = new Map();

if (canonicalData?.form_responses && Array.isArray(canonicalData.form_responses)) {
  const rows = canonicalData.form_responses.slice(1);
  rows.forEach(r => {
    // r[0]: Timestamp, r[1]: Name, r[2]: Department, r[3]: Date, r[4]: Proof, r[5]: Email, r[6]: AI Status, r[7]: AI Reason
    const rawName = String(r[1] || '').trim();
    const idMatch = rawName.match(/^(\d+)/);
    const sId = idMatch ? idMatch[1] : null;
    const date = String(r[3] || '').trim();
    const dept = String(r[2] || '').trim();
    const proofUrl = String(r[4] || '').trim();
    const aiStatus = String(r[6] || 'VALID').trim().toUpperCase();
    const aiReason = String(r[7] || '').trim();

    if (sId) {
      if (!studentSubmissionsMap.has(sId)) {
        studentSubmissionsMap.set(sId, []);
      }
      studentSubmissionsMap.get(sId).push({
        date,
        department: dept,
        proof_url: proofUrl || null,
        ai_status: aiStatus,
        ai_reason: aiReason,
      });

      if (date.startsWith('8/')) {
        if (!studentAugDatesMap.has(sId)) studentAugDatesMap.set(sId, new Set());
        studentAugDatesMap.get(sId).add(date);
      }
    }
  });
}

// Build September Daily Status from Attendance Matrix
const sepStudentDailyMap = new Map();
if (canonicalData?.attendance_matrix && Array.isArray(canonicalData.attendance_matrix)) {
  const headerRow = canonicalData.attendance_matrix[2] || [];
  const matrixDates = headerRow.slice(2);
  const rows = canonicalData.attendance_matrix.slice(3);

  rows.forEach(r => {
    const rawName = String(r[0] || '').trim();
    const idMatch = rawName.match(/^(\d+)/);
    const sId = idMatch ? idMatch[1] : null;
    if (sId) {
      const daily = {};
      matrixDates.forEach((d, idx) => {
        const val = String(r[idx + 2] || 'A').trim().toUpperCase();
        let st = 'ABSENT';
        if (val === 'P' || val === 'PRESENT') st = 'PRESENT';
        else if (val === 'H' || val === 'HOLIDAY') st = 'HOLIDAY';
        else if (val === 'OD' || val.includes('DUTY')) {
          // Legacy OD encountered: Do not expose OD in UI/API. Flag for migration handling.
          st = 'ABSENT';
        } else {
          st = 'ABSENT';
        }
        daily[d] = st;
      });
      sepStudentDailyMap.set(sId, daily);
    }
  });
}

export function getSepDailyStatus(studentId) {
  return sepStudentDailyMap.get(String(studentId)) || {};
}

export function getCanonicalSubmissions(targetMonth = 'August 2026') {
  const mLower = String(targetMonth || '').toLowerCase().trim();
  const isAug = mLower.startsWith('aug');
  const isSep = mLower.startsWith('sep');
  const all = [];

  for (const [sId, subs] of studentSubmissionsMap.entries()) {
    const st = ROSTER_STUDENTS.find(s => s.id === sId);
    subs.forEach(sub => {
      const matchMonth = (isAug && sub.date.startsWith('8/')) || (isSep && sub.date.startsWith('9/'));
      if (matchMonth) {
        all.push({
          student_id: sId,
          roll_no: sId,
          student_name: st?.name || '',
          department: sub.department || st?.department || '',
          date_of_attendance: sub.date,
          ai_status: sub.ai_status,
          ai_explanation: sub.ai_reason || 'Verified submission',
          image_url: sub.proof_url || null,
          created_at: new Date().toISOString(),
        });
      }
    });
  }
  return all;
}

/**
 * Robust date parser for spreadsheet date headers (e.g. '9/3/2026', '03/09/2026', '2026-09-03')
 */
export function parseDateString(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.trim().split(/[/.-]/);
  if (parts.length === 3) {
    let year, month, day;
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (p0 > 12) {
        day = p0;
        month = p1 - 1;
      } else {
        month = p0 - 1;
        day = p1;
      }
    }
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 23, 59, 59);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Checks if a date header is on or before the current day
 */
export function isDateElapsedOrToday(dateStr) {
  const d = parseDateString(dateStr);
  if (!d) return true;
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return d <= endOfToday;
}

/**
 * Dynamically finds all elapsed dates in September where roll calls have occurred
 */
export function getActiveElapsedSeptemberDates() {
  const datesWithRollCall = [];
  SEPTEMBER_DATES.forEach(d => {
    if (!isDateElapsedOrToday(d)) return;
    let hasAnyPresent = false;
    for (const [_, daily] of sepStudentDailyMap.entries()) {
      if (daily[d] === 'PRESENT' || daily[d] === 'Present') {
        hasAnyPresent = true;
        break;
      }
    }
    if (hasAnyPresent) datesWithRollCall.push(d);
  });
  if (datesWithRollCall.length > 0) return datesWithRollCall;
  const elapsed = SEPTEMBER_DATES.filter(d => isDateElapsedOrToday(d));
  return elapsed.length > 0 ? elapsed : ['9/1/2026'];
}

/**
 * Returns processed data for Tab 1 (Recent Submissions - Section 2)
 * Strictly displays only records where a student actually submitted attendance on the selected date.
 * Banned: ABSENT rows never appear here.
 * AI Statuses: PENDING, VERIFIED, REJECTED.
 */
export function getRecentAttendanceData(liveDataOrDate = null, maybeDate = null) {
  let liveData = null;
  let targetDate = null;
  if (typeof liveDataOrDate === 'string') {
    targetDate = liveDataOrDate;
  } else {
    liveData = liveDataOrDate;
    targetDate = maybeDate;
  }

  // 1. Gather all submissions from liveData or fallback
  let allSubmissions = [];
  if (liveData?.all_submissions && Array.isArray(liveData.all_submissions)) {
    allSubmissions = liveData.all_submissions;
  } else if (liveData?.submissions && Array.isArray(liveData.submissions)) {
    allSubmissions = liveData.submissions;
  } else if (liveData?.records && Array.isArray(liveData.records) && liveData.records.some(r => r.submission_time || r.timestamp || r.ai_status)) {
    allSubmissions = liveData.records;
  } else {
    // Canonical fallback from Form Responses 1
    for (const [sId, subs] of studentSubmissionsMap.entries()) {
      const st = ROSTER_STUDENTS.find(s => s.id === sId);
      subs.forEach((sub, idx) => {
        allSubmissions.push({
          id: `${sId}-${idx}`,
          student_id: sId,
          roll_no: sId,
          student_name: st?.name || '',
          name: st?.name || '',
          department: sub.department || st?.department || 'General',
          date_of_attendance: sub.date,
          date: sub.date,
          submission_time: '2026-09-02T09:00:00Z',
          proof_url: sub.proof_url || null,
          ai_status: sub.ai_status === 'FLAGGED' ? 'REJECTED' : 'VERIFIED',
          ai_explanation: sub.ai_reason || 'Verified submission',
        });
      });
    }
  }

  // 2. Build unique available dates list (sorted newest to oldest)
  const dateCounts = new Map();
  allSubmissions.forEach(sub => {
    const d = sub.date_of_attendance || sub.date;
    if (d) {
      dateCounts.set(d, (dateCounts.get(d) || 0) + 1);
    }
  });

  if (liveData?.dates && Array.isArray(liveData.dates)) {
    liveData.dates.forEach(d => {
      if (d && !dateCounts.has(d)) {
        dateCounts.set(d, 0);
      }
    });
  }

  const availableDates = Array.from(dateCounts.keys()).map(d => {
    const count = dateCounts.get(d) || 0;
    const now = new Date();
    const parsedDate = parseDateString(d);
    const isToday = parsedDate &&
      parsedDate.getFullYear() === now.getFullYear() &&
      parsedDate.getMonth() === now.getMonth() &&
      parsedDate.getDate() === now.getDate();
    return {
      date: d,
      label: `${d} (${isToday ? 'Today • ' : ''}${count} Submitted)`,
      isCompleted: true,
      presentCount: count,
      count,
    };
  }).sort((a, b) => {
    const parseD = (str) => {
      if (!str) return 0;
      const s = String(str).trim();
      if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
        return new Date(s).getTime() || 0;
      }
      const parts = s.split(/[/.-]/).map(p => parseInt(p, 10));
      if (parts.length === 3) {
        let year = parts[2];
        if (year < 100) year += 2000;
        let month = parts[0];
        let day = parts[1];
        if (parts[0] > 12 && parts[1] <= 12) {
          day = parts[0];
          month = parts[1];
        }
        return new Date(year, month - 1, day).getTime() || 0;
      }
      const parsed = new Date(s).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };
    return parseD(b.date) - parseD(a.date);
  });

  const latestDate = liveData?.latest_date || (availableDates[0]?.date) || '9/5/2026';
  const resolvedDate = targetDate || latestDate;

  // 3. Filter strictly to submitted records for resolvedDate (ABSENT STUDENTS NEVER APPEAR)
  let matchingSubmissions = allSubmissions.filter(s => (s.date_of_attendance || s.date) === resolvedDate);
  if (matchingSubmissions.length === 0 && liveData?.submissions && (liveData.date === resolvedDate || !targetDate)) {
    matchingSubmissions = liveData.submissions;
  }

  const records = matchingSubmissions.map((sub, idx) => {
    let aiStatus = 'PENDING';
    const rawAi = String(sub.ai_status || '').toUpperCase();
    if (rawAi.includes('VERIF') || rawAi === 'VALID' || rawAi === 'APPROVED' || rawAi === 'SUCCESS') {
      aiStatus = 'VERIFIED';
    } else if (rawAi.includes('FLAG') || rawAi.includes('REJECT') || rawAi.includes('INVALID') || rawAi.includes('FAIL') || rawAi.includes('ERR')) {
      aiStatus = 'REJECTED';
    } else {
      aiStatus = 'PENDING';
    }

    return {
      id: sub.id || sub.student_id || String(idx + 1),
      roll_no: sub.roll_no || sub.student_id || String(idx + 1),
      student_id: sub.student_id || sub.roll_no || String(idx + 1),
      name: sub.student_name || sub.name || '',
      student_name: sub.student_name || sub.name || '',
      department: sub.department || 'General',
      submission_time: sub.submission_time || sub.timestamp || '',
      proof_url: sub.proof_url || sub.image_url || null,
      image_link: sub.proof_url || sub.image_url || null,
      ai_status: aiStatus,
      ai_explanation: sub.ai_explanation || sub.ai_reason || (aiStatus === 'VERIFIED' ? 'AI verification confirmed' : (aiStatus === 'REJECTED' ? 'AI flagged submission' : 'Pending verification')),
      date: sub.date_of_attendance || sub.date || resolvedDate,
    };
  });

  const totalSubmissions = records.length;
  const verifiedCount = records.filter(r => r.ai_status === 'VERIFIED').length;
  const pendingCount = records.filter(r => r.ai_status === 'PENDING').length;
  const rejectedCount = records.filter(r => r.ai_status === 'REJECTED').length;

  return {
    date: resolvedDate,
    availableDates,
    records,
    submissions: records,
    total_submissions: totalSubmissions,
    summary: {
      totalSubmissions,
      totalStudents: totalSubmissions,
      presentCount: verifiedCount,
      verifiedCount,
      pendingCount,
      rejectedCount,
      absentCount: 0,
      attendanceRate: totalSubmissions > 0 ? Math.round((verifiedCount / totalSubmissions) * 100) : 0,
    }
  };
}

/**
 * Returns processed data for Tab 2 (Student Portal - Section 3)
 * Authoritative backend calculations when liveData is passed; consistent fallback otherwise.
 */
export function getStudentPortalData(arg1 = null, arg2 = '1', arg3 = 'September 2026') {
  let liveData = null;
  let studentId = '1';
  let selectedMonth = 'September 2026';

  if (arg1 && typeof arg1 === 'object' && (arg1.daily_records || arg1.summary || arg1.records || arg1.logs)) {
    liveData = arg1;
    studentId = String(arg2 || '1');
    selectedMonth = String(arg3 || 'September 2026');
  } else {
    studentId = String(arg1 || '1');
    selectedMonth = String(arg2 || 'September 2026');
  }

  // If live backend Student Portal response is provided, use it directly (Rule 11: Dumb UI, Smart Backend)
  if (liveData && liveData.summary && Array.isArray(liveData.daily_records)) {
    const summary = liveData.summary;
    const dailyRecords = liveData.daily_records;
    const activeStudent = liveData.student || ROSTER_STUDENTS.find(s => s.id === studentId) || ROSTER_STUDENTS[0];

    const ledgerRows = dailyRecords.map(r => ({
      date: r.date,
      department: r.department,
      status: r.attendance_status === 'PRESENT' ? 'Present' : (r.attendance_status === 'HOLIDAY' ? 'Holiday' : 'Absent'),
      validity: r.is_valid_attendance
        ? 'Valid ✅'
        : (r.submission?.ai_status === 'REJECTED' ? 'Flagged ⚠️' : (r.submission?.ai_status === 'PENDING' ? 'Pending ⏳' : '-')),
      explanation: r.explanation,
      image_link: r.proof_url,
      proof_url: r.proof_url,
      is_valid_attendance: r.is_valid_attendance,
      stipend_credit: r.stipend_credit,
      submission: r.submission,
    }));

    const monthlyBreakdown = Array.isArray(liveData.monthlyBreakdown || liveData.monthly_breakdown)
      ? (liveData.monthlyBreakdown || liveData.monthly_breakdown)
      : ACADEMIC_MONTHS.map(m => {
          const isCur = m.toLowerCase().includes((liveData.month || selectedMonth).toLowerCase().slice(0, 3));
          return {
            month: m,
            daysPresent: isCur ? summary.valid_present_sessions : 0,
            workingDaysToDate: isCur ? summary.eligible_sessions : 0,
            totalDays: isCur ? summary.total_calendar_days : 0,
            attendanceRate: isCur ? summary.attendance_rate : 0,
            status: isCur ? (summary.attendance_rate >= 75 ? 'Disbursed' : 'In Progress') : 'Upcoming',
            payout: isCur ? summary.estimated_monthly_stipend : 0,
            formattedPayout: isCur ? summary.formatted_stipend : '₹0.00',
          };
        });

    return {
      student: activeStudent,
      month: liveData.month || selectedMonth,
      totalDays: summary.total_calendar_days,
      workingDaysToDate: summary.eligible_sessions,
      daysPresent: summary.valid_present_sessions,
      daysAbsent: summary.absent_sessions,
      holidayCount: summary.holiday_sessions,
      attendanceRate: summary.attendance_rate,
      sessionHours: summary.session_hours,
      dailyRate: summary.rate_per_session,
      estimatedPay: summary.formatted_stipend,
      numericEstimatedPay: summary.estimated_monthly_stipend,
      status: summary.standing,
      ledgerRows,
      cumulativeData: liveData.cumulative_income || [],
      monthlyBreakdown,
      monthly_breakdown: monthlyBreakdown,
      summary,
      daily_records: dailyRecords,
      totalTermEarnings: summary.formatted_stipend,
    };
  }

  // Fallback computation
  const activeStudent = ROSTER_STUDENTS.find(s => s.id === studentId) || ROSTER_STUDENTS[0];
  const sId = activeStudent.id;
  const mLower = String(selectedMonth).toLowerCase().trim();
  const isAugust = mLower.startsWith('aug');
  const isSeptember = mLower.startsWith('sep');

  const submissions = studentSubmissionsMap.get(sId) || [];
  const sepDaily = sepStudentDailyMap.get(sId) || {};

  const dates = isAugust ? AUGUST_DATES : (isSeptember ? SEPTEMBER_DATES : []);
  const dailyRate = 65;
  const ledgerRows = [];
  let validPresentCount = 0;
  let holidayCount = 0;

  dates.forEach(d => {
    let rawStatus = 'ABSENT';
    if (isSeptember) {
      rawStatus = sepDaily[d] || 'ABSENT';
    } else if (isAugust) {
      const matchSub = submissions.find(s => s.date === d);
      rawStatus = matchSub ? 'PRESENT' : 'ABSENT';
    }

    let attendanceStatus = 'ABSENT';
    if (rawStatus === 'HOLIDAY' || rawStatus === 'H') {
      attendanceStatus = 'HOLIDAY';
      holidayCount++;
    } else if (rawStatus === 'PRESENT' || rawStatus === 'P') {
      attendanceStatus = 'PRESENT';
    } else {
      attendanceStatus = 'ABSENT';
    }

    const matchSub = submissions.find(s => s.date === d);
    let isValidAttendance = false;
    let explanation = 'No attendance record';

    if (matchSub) {
      const isVerified = matchSub.ai_status !== 'FLAGGED' && matchSub.ai_status !== 'REJECTED';
      if (isVerified && attendanceStatus === 'PRESENT') {
        isValidAttendance = true;
        explanation = 'Verified submission';
      } else if (!isVerified) {
        explanation = matchSub.ai_reason || 'AI verification rejected';
      }
    } else if (attendanceStatus === 'PRESENT') {
      isValidAttendance = true;
      explanation = 'Verified institutional presence';
    } else if (attendanceStatus === 'HOLIDAY') {
      explanation = 'Official holiday';
    }

    if (isValidAttendance) validPresentCount++;

    ledgerRows.push({
      date: d,
      department: matchSub?.department || activeStudent.department,
      status: attendanceStatus === 'PRESENT' ? 'Present' : (attendanceStatus === 'HOLIDAY' ? 'Holiday' : 'Absent'),
      validity: isValidAttendance
        ? 'Valid ✅'
        : (matchSub?.ai_status === 'FLAGGED' ? 'Flagged ⚠️' : '-'),
      explanation,
      image_link: matchSub?.proof_url || null,
      proof_url: matchSub?.proof_url || null,
      is_valid_attendance: isValidAttendance,
      stipend_credit: isValidAttendance ? dailyRate : 0,
    });
  });

  const totalDays = dates.length;
  const eligibleSessions = Math.max(0, totalDays - holidayCount);
  const attendanceRate = eligibleSessions > 0 ? Math.round((validPresentCount / eligibleSessions) * 100) : 0;
  const estimatedPay = validPresentCount * dailyRate;
  const sessionHours = validPresentCount * 4.0;

  let running = 0;
  const cumulativeData = ledgerRows.map(r => {
    if (r.is_valid_attendance) running += dailyRate;
    return {
      date: r.date,
      cumulativePay: running,
      cumulative_pay: running,
      status: r.status,
    };
  });

  const monthlyBreakdown = ACADEMIC_MONTHS.map(m => {
    const isCur = m.toLowerCase().includes(String(selectedMonth).toLowerCase().slice(0, 3));
    return {
      month: m,
      daysPresent: isCur ? validPresentCount : 0,
      workingDaysToDate: isCur ? eligibleSessions : 0,
      totalDays: isCur ? totalDays : 0,
      attendanceRate: isCur ? attendanceRate : 0,
      status: isCur ? (attendanceRate >= 75 ? 'Disbursed' : 'In Progress') : 'Upcoming',
      payout: isCur ? estimatedPay : 0,
      formattedPayout: isCur ? `₹${estimatedPay.toFixed(2)}` : '₹0.00',
    };
  });

  return {
    student: activeStudent,
    month: selectedMonth,
    totalDays,
    workingDaysToDate: eligibleSessions,
    daysPresent: validPresentCount,
    daysAbsent: Math.max(0, eligibleSessions - validPresentCount),
    holidayCount,
    attendanceRate,
    sessionHours,
    dailyRate,
    estimatedPay: `₹${estimatedPay.toFixed(2)}`,
    numericEstimatedPay: estimatedPay,
    status: attendanceRate >= 85 ? 'Outstanding' : (attendanceRate >= 75 ? 'Good Standing' : 'Below Target'),
    ledgerRows,
    cumulativeData,
    monthlyBreakdown,
    monthly_breakdown: monthlyBreakdown,
    totalTermEarnings: `₹${estimatedPay.toFixed(2)}`,
  };
}

/**
 * Returns processed data for Tab 3 (Attendance Matrix & Analytics - Section 4)
 */
export function getTestMatrixData(arg1 = null, arg2 = 'September 2026') {
  let liveData = null;
  let targetMonth = 'September 2026';

  if (arg1 && typeof arg1 === 'object' && (arg1.records || arg1.dates)) {
    liveData = arg1;
    targetMonth = String(arg2 || 'September 2026');
  } else {
    targetMonth = String(arg1 || 'September 2026');
  }

  // If live backend matrix response is provided with analytics, use it
  if (liveData && Array.isArray(liveData.records) && liveData.records.length > 0) {
    const records = liveData.records.map(r => ({
      ...r,
      displayName: `#${r.id} ${r.name} (${r.department || 'General'})`,
      student_name: r.student_name || r.name,
      payout: `₹${(r.present_days * 65).toFixed(2)}`,
      numeric_payout: r.present_days * 65,
      history: r.daily_status || r.history || {},
    }));

    // Ensure analytics exist
    let analytics = liveData.analytics;
    if (!analytics || !analytics.overall_class_average) {
      const totalStudents = records.length;
      const overallClassAverage = totalStudents > 0
        ? Math.round(records.reduce((sum, r) => sum + (r.attendance_rate || 0), 0) / totalStudents)
        : 0;

      const deptMap = new Map();
      records.forEach(r => {
        const dept = r.department || 'General';
        if (!deptMap.has(dept)) deptMap.set(dept, { department: dept, count: 0, totalRate: 0, totalPresent: 0 });
        const entry = deptMap.get(dept);
        entry.count++;
        entry.totalRate += (r.attendance_rate || 0);
        entry.totalPresent += (r.present_days || 0);
      });

      const departmentBreakdown = Array.from(deptMap.values()).map(d => ({
        department: d.department,
        student_count: d.count,
        average_attendance_rate: d.count > 0 ? Math.round(d.totalRate / d.count) : 0,
        total_present_sessions: d.totalPresent,
      })).sort((a, b) => b.average_attendance_rate - a.average_attendance_rate);

      analytics = {
        overall_class_average: overallClassAverage,
        student_primary_department: records[0] ? {
          student_id: records[0].id,
          student_name: records[0].name,
          primary_department: records[0].department,
          participation_count: records[0].present_days,
        } : null,
        department_breakdown: departmentBreakdown,
      };
    }

    const activeElapsed = liveData.elapsed_dates || liveData.active_elapsed || (liveData.dates || []).filter(isDateElapsedOrToday);
    return {
      month: liveData.month || targetMonth,
      dates: liveData.dates || [],
      activeElapsed,
      elapsed_dates: activeElapsed,
      records,
      analytics,
    };
  }

  // Fallback calculation for Matrix
  const mLower = String(targetMonth).toLowerCase().trim();
  const isAugust = mLower.startsWith('aug');
  const dates = isAugust ? AUGUST_DATES : SEPTEMBER_DATES;
  const activeElapsed = isAugust ? AUGUST_DATES : getActiveElapsedSeptemberDates();

  const records = ROSTER_STUDENTS.map(st => {
    const daily = isAugust ? {} : (sepStudentDailyMap.get(st.id) || {});
    const history = {};
    let presentCount = 0;

    dates.forEach(d => {
      let val = 'ABSENT';
      if (isAugust) {
        const augDates = studentAugDatesMap.get(st.id) || new Set();
        val = augDates.has(d) ? 'PRESENT' : 'ABSENT';
      } else {
        val = daily[d] || 'ABSENT';
      }

      history[d] = val;
      if (val === 'PRESENT' && activeElapsed.includes(d)) {
        presentCount++;
      }
    });

    const elapsedCount = Math.max(1, activeElapsed.length);
    const rate = Math.round((presentCount / elapsedCount) * 100);
    const payout = presentCount * 65;

    return {
      id: st.id,
      name: st.name,
      student_name: st.name,
      displayName: st.displayName,
      department: st.department,
      attendance_rate: rate,
      present_days: presentCount,
      payout: `₹${payout.toFixed(2)}`,
      numeric_payout: payout,
      history,
    };
  });

  // Calculate fallback analytics
  const totalStudents = records.length;
  const overallClassAverage = totalStudents > 0
    ? Math.round(records.reduce((sum, r) => sum + r.attendance_rate, 0) / totalStudents)
    : 0;

  const deptMap = new Map();
  records.forEach(r => {
    const dept = r.department || 'General';
    if (!deptMap.has(dept)) deptMap.set(dept, { department: dept, count: 0, totalRate: 0, totalPresent: 0 });
    const entry = deptMap.get(dept);
    entry.count++;
    entry.totalRate += r.attendance_rate;
    entry.totalPresent += r.present_days;
  });

  const departmentBreakdown = Array.from(deptMap.values()).map(d => ({
    department: d.department,
    student_count: d.count,
    average_attendance_rate: d.count > 0 ? Math.round(d.totalRate / d.count) : 0,
    total_present_sessions: d.totalPresent,
  })).sort((a, b) => b.average_attendance_rate - a.average_attendance_rate);

  const analytics = {
    overall_class_average: overallClassAverage,
    student_primary_department: records[0] ? {
      student_id: records[0].id,
      student_name: records[0].name,
      primary_department: records[0].department,
      participation_count: records[0].present_days,
    } : null,
    department_breakdown: departmentBreakdown,
  };

  return {
    month: targetMonth,
    dates,
    activeElapsed,
    elapsed_dates: activeElapsed,
    records,
    analytics,
  };
}
