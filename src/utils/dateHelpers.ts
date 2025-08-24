// src/utils/dateHelpers.ts
// ENHANCED: Unified timezone handling for consistent time display
// ENHANCED: Better support for detected_at timestamps

// Time zone configuration - centralized settings
const TIME_ZONE_CONFIG = {
  // Primary display timezone - Eastern Time (where markets operate)
  PRIMARY_TZ: 'America/New_York',
  
  // Alternative: Use user's local timezone
  USE_USER_TIMEZONE: false, // Set to true to use user's local timezone instead
  
  // Format options
  SHOW_TIMEZONE: true, // Whether to show timezone abbreviation
  
  // Precision thresholds for different display modes
  SHOW_SECONDS_THRESHOLD: 60, // Show seconds for times within 1 minute
  SHOW_MINUTES_THRESHOLD: 3600, // Show "Xm ago" for times within 1 hour
  SHOW_HOURS_THRESHOLD: 86400, // Show "Xh ago" for times within 24 hours
  SHOW_DAYS_THRESHOLD: 604800, // Show "Xd ago" for times within 7 days
};

/**
 * Get the display timezone - either Eastern Time or user's local timezone
 */
export const getDisplayTimezone = (): string => {
  if (TIME_ZONE_CONFIG.USE_USER_TIMEZONE) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return TIME_ZONE_CONFIG.PRIMARY_TZ;
};

/**
 * Convert UTC timestamp to display timezone
 * ENHANCED: Better error handling for invalid dates
 */
export const convertToDisplayTimezone = (utcDateString: string): Date => {
  if (!utcDateString) {
    return new Date();
  }
  
  try {
    const utcDate = new Date(utcDateString);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      console.warn(`Invalid date string: ${utcDateString}`);
      return new Date();
    }
    
    return utcDate;
  } catch (error) {
    console.warn(`Error parsing date: ${utcDateString}`, error);
    return new Date();
  }
};

/**
 * Format distance to now with precise timing
 * ENHANCED: Uses detected_at time when available for accuracy, with better precision control
 */
export const formatDistanceToNow = (dateString: string, precision: 'high' | 'medium' | 'low' = 'medium'): string => {
  if (!dateString) return 'Unknown time';
  
  const date = convertToDisplayTimezone(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates (shouldn't happen, but safety check)
  if (diffInSeconds < 0) {
    return 'Just filed';
  }

  // High precision mode - show seconds for very recent
  if (precision === 'high' && diffInSeconds < TIME_ZONE_CONFIG.SHOW_SECONDS_THRESHOLD) {
    return diffInSeconds <= 5 ? 'Just now' : `${diffInSeconds}s ago`;
  }

  // Show minutes
  if (diffInSeconds < TIME_ZONE_CONFIG.SHOW_MINUTES_THRESHOLD) {
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
  }

  // Show hours
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

/**
 * Format date for display with timezone awareness
 * ENHANCED: Consistent timezone handling
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = convertToDisplayTimezone(dateString);
  const displayTz = getDisplayTimezone();
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: displayTz,
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format date and time for display with timezone
 * ENHANCED: Shows timezone for clarity
 */
export const formatDateTime = (dateString: string, showSeconds: boolean = false): string => {
  if (!dateString) return '';
  
  const date = convertToDisplayTimezone(dateString);
  const displayTz = getDisplayTimezone();
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds && { second: '2-digit' }),
    timeZone: displayTz,
    timeZoneName: TIME_ZONE_CONFIG.SHOW_TIMEZONE ? 'short' : undefined,
  };
  
  return date.toLocaleString('en-US', options);
};

/**
 * Format precise time (for detected_at timestamps)
 * ENHANCED: Shows precise time with timezone for filing detection
 */
export const formatPreciseTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = convertToDisplayTimezone(dateString);
  const displayTz = getDisplayTimezone();
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: displayTz,
    timeZoneName: 'short',
  };
  
  return date.toLocaleString('en-US', options);
};

/**
 * Format time for card display (used in FilingCard)
 * ENHANCED: Uses detected_at when available, with smart fallback and better logic
 */
export const formatCardTime = (filing: {
  detected_at?: string | null;
  filing_date: string;
  display_time?: string | null;
  detection_age_minutes?: number | null;
  is_recently_detected?: boolean;
}): string => {
  // Priority: display_time (backend calculated) > detected_at > filing_date
  const timeToUse = filing.display_time || filing.detected_at || filing.filing_date;
  
  if (!timeToUse) return '';
  
  // ENHANCED: Use backend-calculated detection_age_minutes if available for accuracy
  if (filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined) {
    const minutes = filing.detection_age_minutes;
    
    if (minutes === 0) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    
    // For older dates, fall through to date formatting
  }
  
  // Fallback to client-side calculation
  const date = convertToDisplayTimezone(timeToUse);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    const displayTz = getDisplayTimezone();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      timeZone: displayTz,
    });
  }
};

/**
 * Format time for calendar display (prevents timezone issues)
 * ENHANCED: Ensures calendar dates are displayed correctly
 */
export const formatCalendarDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // For calendar dates, we want to avoid timezone conversion issues
    // Parse the date components directly
    const [year, month, day] = dateString.split('-').map(num => parseInt(num));
    
    // Create date in local timezone to avoid offset issues
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.warn(`Error formatting calendar date: ${dateString}`, error);
    return formatDate(dateString); // Fallback
  }
};

/**
 * Get timezone display name for UI
 * ENHANCED: Better timezone name detection
 */
export const getTimezoneDisplayName = (): string => {
  const displayTz = getDisplayTimezone();
  
  if (displayTz === 'America/New_York') {
    try {
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: displayTz,
        timeZoneName: 'short'
      });
      
      // This will return "EDT" or "EST" depending on daylight saving
      const parts = formatter.formatToParts(date);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      return timeZoneName || 'ET';
    } catch (error) {
      return 'ET';
    }
  }
  
  if (TIME_ZONE_CONFIG.USE_USER_TIMEZONE) {
    return 'Local Time';
  }
  
  return 'UTC';
};

/**
 * Check if date is today (in display timezone)
 * ENHANCED: Better timezone handling
 */
export const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = convertToDisplayTimezone(dateString);
    const today = new Date();
    const displayTz = getDisplayTimezone();
    
    const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: displayTz }));
    const todayInTz = new Date(today.toLocaleString('en-US', { timeZone: displayTz }));
    
    return (
      dateInTz.getFullYear() === todayInTz.getFullYear() &&
      dateInTz.getMonth() === todayInTz.getMonth() &&
      dateInTz.getDate() === todayInTz.getDate()
    );
  } catch (error) {
    console.warn(`Error checking if date is today: ${dateString}`, error);
    return false;
  }
};

/**
 * Get smart time label (Today, Yesterday, or date)
 * ENHANCED: Better error handling
 */
export const getSmartTimeLabel = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    if (isToday(dateString)) {
      return 'Today';
    }
    
    const date = convertToDisplayTimezone(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isToday(yesterday.toISOString()) && 
        date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return formatDate(dateString);
  } catch (error) {
    console.warn(`Error getting smart time label: ${dateString}`, error);
    return formatDate(dateString);
  }
};

/**
 * ENHANCED: Get urgency level based on timing and filing type
 */
export const getFilingUrgency = (filing: {
  detected_at?: string | null;
  filing_date: string;
  form_type: string;
  detection_age_minutes?: number | null;
}): 'urgent' | 'recent' | 'normal' => {
  // Use detection_age_minutes if available (more accurate)
  if (filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined) {
    const minutes = filing.detection_age_minutes;
    
    // 8-K and S-1 are more urgent
    if (filing.form_type === '8-K' || filing.form_type === 'S-1') {
      if (minutes < 30) return 'urgent';
      if (minutes < 120) return 'recent';
    } else {
      if (minutes < 60) return 'recent';
    }
    
    return 'normal';
  }
  
  // Fallback to client-side calculation
  const timeToCheck = filing.detected_at || filing.filing_date;
  if (!timeToCheck) return 'normal';
  
  const now = new Date();
  const filingTime = convertToDisplayTimezone(timeToCheck);
  const diffInMinutes = Math.floor((now.getTime() - filingTime.getTime()) / (1000 * 60));
  
  if (filing.form_type === '8-K' || filing.form_type === 'S-1') {
    if (diffInMinutes < 30) return 'urgent';
    if (diffInMinutes < 120) return 'recent';
  } else {
    if (diffInMinutes < 60) return 'recent';
  }
  
  return 'normal';
};

/**
 * ENHANCED: Check if filing was detected recently (within specified minutes)
 */
export const isRecentlyDetected = (filing: {
  detected_at?: string | null;
  detection_age_minutes?: number | null;
}, thresholdMinutes: number = 60): boolean => {
  // Use backend calculation if available
  if (filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined) {
    return filing.detection_age_minutes < thresholdMinutes;
  }
  
  // Fallback to client-side calculation
  if (!filing.detected_at) return false;
  
  const now = new Date();
  const detectedTime = convertToDisplayTimezone(filing.detected_at);
  const diffInMinutes = Math.floor((now.getTime() - detectedTime.getTime()) / (1000 * 60));
  
  return diffInMinutes < thresholdMinutes;
};

/**
 * Export timezone configuration for components that need it
 */
export const TIMEZONE_CONFIG = {
  displayTz: getDisplayTimezone(),
  displayName: getTimezoneDisplayName(),
  showTimezone: TIME_ZONE_CONFIG.SHOW_TIMEZONE,
  useUserTimezone: TIME_ZONE_CONFIG.USE_USER_TIMEZONE,
  primaryTz: TIME_ZONE_CONFIG.PRIMARY_TZ,
};