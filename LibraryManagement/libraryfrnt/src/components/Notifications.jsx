
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox
} from 'lucide-react';

import api from './context/api/api';

const Notifications = () => {
  // State Management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get(
        'notifications/member/unread-count/'
      );

      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Unread Count Error:', err);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageUrl = null) => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (pageUrl) {
        // Convert absolute pagination URL into a path
        // so the configured Axios base URL is retained.
        const parsedUrl = new URL(pageUrl, window.location.origin);
        const requestUrl = `${parsedUrl.pathname}${parsedUrl.search}`;

        response = await api.get(requestUrl);
      } else {
        response = await api.get(
          `notifications/member/?page=${currentPage}`
        );
      }

      const data = response.data;

      if (Array.isArray(data.results)) {
        setNotifications(data.results);
        setNextPageUrl(data.next);
        setPrevPageUrl(data.previous);
        setTotalCount(data.count || 0);
      } else {
        const results = Array.isArray(data) ? data : [];

        setNotifications(results);
        setNextPageUrl(null);
        setPrevPageUrl(null);
        setTotalCount(results.length);
      }

    } catch (err) {
      console.error('Notifications Error:', err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'Failed to load notifications.'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Initial Load
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, [fetchUnreadCount, fetchNotifications]);

  // Refresh
  const handleRefresh = () => {
    fetchUnreadCount();
    fetchNotifications();
  };

  // Mark Single Notification as Read
  const handleMarkAsRead = async (id) => {
    try {
      await api.post(
        `notifications/member/${id}/mark-read/`
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id
            ? {
                ...notif,
                read_at: new Date().toISOString(),
                status: 'READ'
              }
            : notif
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));

    } catch (err) {
      console.error('Mark Read Error:', err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to mark notification as read.'
      );
    }
  };

  // Mark All Notifications as Read
  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    setError(null);

    try {
      await api.post(
        'notifications/member/mark-all-read/'
      );

      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read_at: notif.read_at || new Date().toISOString(),
          status: 'READ'
        }))
      );

      setUnreadCount(0);

    } catch (err) {
      console.error('Mark All Read Error:', err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to mark all notifications as read.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination
  const handlePreviousPage = () => {
    if (prevPageUrl) {
      fetchNotifications(prevPageUrl);
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      fetchNotifications(nextPageUrl);
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE5] p-4 md:p-6 lg:p-8 space-y-6 font-serif text-[#454D3B]">

      {/* Header */}
      <div className="bg-[#FBF9F3] border border-[#DDD8C9] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#E4E8D9] text-[#65745A] flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[#394332]">
              Your Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="bg-[#E4E8D9] text-[#58684C] font-bold text-xs px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <p className="text-sm text-[#858573]">
            Stay updated on your library borrowings, returns, and due date alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#F3EFE5] border border-[#D9D5C8] hover:bg-[#EAE6DA] text-[#58634D] text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              disabled={actionLoading}
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 bg-[#718064] hover:bg-[#5D6D51] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {actionLoading ? 'Processing...' : 'Mark all as read'}
            </button>
          )}

        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#F6E8E2] border border-[#E8C9B9] text-[#925B47] text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Notifications Container */}
      <div className="bg-[#FBF9F3] rounded-2xl border border-[#DDD8C9] shadow-sm overflow-hidden">

        {loading ? (
          <div className="py-16 text-center text-[#92917F]">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-[#718064]" />
            Loading your notifications...
          </div>

        ) : notifications.length === 0 ? (

          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-[#EAE9DD] text-[#858D78] rounded-full flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#46513D]">
                All caught up!
              </h3>

              <p className="text-sm text-[#92917F] mt-1">
                You don't have any in-app notifications right now.
              </p>
            </div>
          </div>

        ) : (

          <div className="divide-y divide-[#E9E4D8]">

            {notifications.map((notif) => {
              const isUnread = !notif.read_at;

              return (
                <div
                  key={notif.id}
                  className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                    isUnread
                      ? 'bg-[#F0F1E7] hover:bg-[#E9ECDF]'
                      : 'bg-[#FBF9F3] hover:bg-[#F4F0E6]'
                  }`}
                >

                  <div className="flex items-start gap-4">

                    {/* Unread Indicator */}
                    <div className="mt-1.5 shrink-0">
                      {isUnread ? (
                        <span className="w-2.5 h-2.5 bg-[#718064] rounded-full block ring-4 ring-[#E1E6D7]" />
                      ) : (
                        <span className="w-2.5 h-2.5 bg-[#D4D1C4] rounded-full block" />
                      )}
                    </div>

                    <div className="space-y-1.5">

                      <div className="flex items-center gap-3 flex-wrap">

                        <h4 className={`text-sm ${
                          isUnread
                            ? 'font-bold text-[#394332]'
                            : 'font-semibold text-[#656A59]'
                        }`}>
                          {notif.title || 'Library Notification'}
                        </h4>

                        <span className="text-xs text-[#9A9887]">
                          {notif.created_at
                            ? new Date(notif.created_at).toLocaleString()
                            : 'Date unavailable'}
                        </span>

                      </div>

                      <p className="text-sm text-[#747666] leading-relaxed">
                        {notif.message || notif.body || 'No message content.'}
                      </p>

                    </div>
                  </div>

                  {/* Mark as Read */}
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#647557] hover:text-[#45543C] bg-[#F9F7EF] border border-[#D8DDCC] hover:bg-[#E9ECDF] px-3 py-2 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}

                </div>
              );
            })}

          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-4 border-t border-[#DDD8C9] flex items-center justify-between text-xs text-[#858573] bg-[#F3EFE5]">

          <div>
            Showing <span className="font-bold text-[#4B5542]">{notifications.length}</span> of{' '}
            <span className="font-bold text-[#4B5542]">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-3">

            <button
              disabled={!prevPageUrl || loading}
              onClick={handlePreviousPage}
              className="p-2 border border-[#D9D5C8] rounded-lg bg-[#FBF9F3] hover:bg-[#EAE6DA] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-[#4B5542]">
              Page {currentPage}
            </span>

            <button
              disabled={!nextPageUrl || loading}
              onClick={handleNextPage}
              className="p-2 border border-[#D9D5C8] rounded-lg bg-[#FBF9F3] hover:bg-[#EAE6DA] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
