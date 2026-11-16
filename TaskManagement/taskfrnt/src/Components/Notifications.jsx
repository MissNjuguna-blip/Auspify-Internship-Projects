import React, { useCallback, useEffect, useState } from "react";
import api from "./context/api/api";

const Notifications = () => {

  // Notification data
  const [notificationsData, setNotificationsData] = useState({
    count: 0,
    unread_count: 0,
    notifications: [],
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Error handling
  const [error, setError] = useState(null);

  // Filters
  const [filter, setFilter] = useState("all");

  // Selected notification
  const [selectedNotification, setSelectedNotification] = useState(null);

  // View modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const fetchNotifications = useCallback(async () => {

    setLoading(true);
    setError(null);

    try {

      const response = await api.get("notifications/");

      const data = response.data.results || response.data;

      const notificationList = Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data)
          ? data
          : [];

      setNotificationsData({
        count: data.count ?? notificationList.length,

        unread_count: data.unread_count ??
          notificationList.filter((n) => !n.is_read).length,

        notifications: notificationList,
      });

    } catch (err) {

      console.error("Failed to fetch notifications:", err);

      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Unable to load notifications. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    fetchNotifications();

  }, [fetchNotifications]);
    const handleMarkAsRead = async (id) => {

    try {

      setSaving(true);
      setError(null);

      await api.patch(
        `notifications/${id}/read/`
      );

      setNotificationsData((previous) => {

        const updatedNotifications =
          previous.notifications.map((notif) => {

            if (notif.id === id) {

              return {
                ...notif,
                is_read: true,
              };

            }

            return notif;

          });

        return {
          ...previous,

          unread_count: Math.max(
            0,
            previous.unread_count - (
              previous.notifications.some(
                (n) => n.id === id && !n.is_read
              ) ? 1 : 0
            )
          ),

          notifications: updatedNotifications,

        };

      });

    } catch (err) {

      console.error("Failed to mark notification as read:", err);

      setError(
        err.response?.data?.error ||
        "Unable to mark notification as read."
      );

    } finally {

      setSaving(false);

    }

  };
    const handleMarkAllAsRead = async () => {

    try {

      setSaving(true);
      setError(null);

      await api.patch(
        "notifications/mark-all-read/"
      );

      setNotificationsData((previous) => ({

        ...previous,

        unread_count: 0,

        notifications: previous.notifications.map((notif) => ({

          ...notif,

          is_read: true,

        })),

      }));

    } catch (err) {

      console.error("Failed to mark all notifications as read:", err);

      setError(
        err.response?.data?.error ||
        "Unable to mark all notifications as read."
      );

    } finally {

      setSaving(false);

    }

  };
    const handleDeleteNotification = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmed) return;

    try {

      setSaving(true);
      setError(null);

      await api.delete(
        `notifications/${id}/delete/`
      );

      setNotificationsData((previous) => {

        const deletedNotification =
          previous.notifications.find(
            (notif) => notif.id === id
          );

        const remainingNotifications =
          previous.notifications.filter(
            (notif) => notif.id !== id
          );

        return {

          count: Math.max(0, previous.count - 1),

          unread_count: Math.max(
            0,
            previous.unread_count -
              (deletedNotification && !deletedNotification.is_read ? 1 : 0)
          ),

          notifications: remainingNotifications,

        };

      });

      if (selectedNotification?.id === id) {
        setIsViewModalOpen(false);
        setSelectedNotification(null);
      }

    } catch (err) {

      console.error("Failed to delete notification:", err);

      setError(
        err.response?.data?.error ||
        "Unable to delete notification."
      );

    } finally {

      setSaving(false);

    }

  };
    const handleClearNotifications = async () => {

    if (!window.confirm(
      "Are you sure you want to clear all notifications?"
    )) return;

    try {

      setSaving(true);
      setError(null);

      await api.delete("notifications/clear/");

      setNotificationsData({

        count: 0,

        unread_count: 0,

        notifications: [],

      });

    } catch (err) {

      console.error("Failed to clear notifications:", err);

      setError(
        err.response?.data?.error ||
        "Unable to clear notifications."
      );

    } finally {

      setSaving(false);

    }

  };
    const handleViewNotification = async (notification) => {

    try {

      setError(null);

      const response = await api.get(
        `notifications/${notification.id}/`
      );

      setSelectedNotification(response.data);

      setIsViewModalOpen(true);

    } catch (err) {

      console.error("Failed to fetch notification details:", err);

      setError(
        err.response?.data?.error ||
        "Unable to load notification details."
      );

    }

  };
    const isAlarmTriggered = (type) => {

    return (
      type === "deadline_reminder" ||
      type === "status_changed"
    );

  };


  const getNotificationIcon = (type) => {

    switch (type) {

      case "task_completed":

        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />

            </svg>

          </div>
        );


      case "deadline_reminder":

        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 animate-pulse">

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

          </div>
        );


      case "status_changed":

        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />

            </svg>

          </div>
        );


      default:

        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">

            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />

            </svg>

          </div>
        );

    }

  };


  const getStatusBadge = (type) => {

    switch (type) {

      case "task_completed":

        return (
          <span className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
            Completed
          </span>
        );


      case "deadline_reminder":

        return (
          <span className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
            Due / Alarm
          </span>
        );


      case "status_changed":

        return (
          <span className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
            Status Changed
          </span>
        );


      default:

        return (
          <span className="bg-slate-100 text-slate-800 border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border">
            General
          </span>
        );

    }

  };
    const filteredNotifications = notificationsData.notifications.filter(
    (notif) => {

      if (filter === "unread") {
        return !notif.is_read;
      }

      if (filter === "alarms") {

        return (
          isAlarmTriggered(notif.notification_type) &&
          !notif.is_read
        );

      }

      return true;

    }
  );


  const activeAlarmsCount =
    notificationsData.notifications.filter(
      (notif) =>
        isAlarmTriggered(notif.notification_type) &&
        !notif.is_read
    ).length;
      return (

    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">

      <div className="max-w-4xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Notifications & Alarms
              </h1>

              {notificationsData.unread_count > 0 && (

                <span className="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                  {notificationsData.unread_count} new
                </span>

              )}

            </div>

            <p className="text-sm text-slate-500 mt-1">
              Monitor active project alarms, task deadlines, and completion statuses.
            </p>

          </div>


          <div className="flex flex-wrap gap-2">

            {notificationsData.unread_count > 0 && (

              <button
                onClick={handleMarkAllAsRead}
                disabled={saving}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium px-4 py-2.5 rounded-xl shadow-sm text-sm disabled:opacity-50"
              >
                {saving ? "Updating..." : "Mark all as read"}
              </button>

            )}

            {notificationsData.count > 0 && (

              <button
                onClick={handleClearNotifications}
                disabled={saving}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                Clear all
              </button>

            )}

          </div>

        </div>


        {/* ERROR */}

        {error && (

          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl mb-6 flex justify-between gap-3">

            <span>{error}</span>

            <button
              onClick={() => setError(null)}
              className="font-bold"
            >
              ×
            </button>

          </div>

        )}
                {activeAlarmsCount > 0 && (

          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 shadow-sm">

            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

            </svg>

            <div>

              <h4 className="text-sm font-bold">
                Action Required: Active Deadlines / Alarms
              </h4>

              <p className="text-xs text-rose-700 mt-0.5">

                You have {activeAlarmsCount} urgent task deadline reminder(s) or status change alert(s) that require your attention.

              </p>

            </div>

          </div>

        )}
                <div className="flex items-center gap-2 mb-4 flex-wrap">

          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All ({notificationsData.count})
          </button>


          <button
            onClick={() => setFilter("unread")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "unread"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Unread ({notificationsData.unread_count})
          </button>


          <button
            onClick={() => setFilter("alarms")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "alarms"
                ? "bg-rose-600 text-white"
                : "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            Alarms / Due ({activeAlarmsCount})
          </button>

        </div>
                {loading ? (

          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">

            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />

            <p className="text-slate-400 font-medium">
              Loading notifications...
            </p>

          </div>

        ) : filteredNotifications.length === 0 ? (

          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">

            <p className="text-slate-500 font-medium">
              No notifications found for this filter.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {filteredNotifications.map((notif) => {

              const isAlarm =
                isAlarmTriggered(notif.notification_type) &&
                !notif.is_read;

              return (

                <div
                  key={notif.id}
                  className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-4 ${
                    isAlarm
                      ? "bg-rose-50/50 border-rose-300 shadow-md ring-2 ring-rose-500/10"
                      : notif.is_read
                        ? "bg-white border-slate-200 shadow-sm"
                        : "bg-indigo-50/40 border-indigo-200 shadow-sm ring-1 ring-indigo-500/10"
                  }`}
                >

                  {getNotificationIcon(notif.notification_type)}


                  <div className="flex-1 min-w-0">

                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="text-sm font-bold text-slate-900">
                          {notif.title}
                        </h3>

                        {getStatusBadge(notif.notification_type)}

                      </div>


                      <span className="text-xs text-slate-400 shrink-0">

                        {notif.created_at
                          ? new Date(notif.created_at).toLocaleString()
                          : "Date unavailable"
                        }

                      </span>

                    </div>


                    <p className="text-sm text-slate-600 mb-3">
                      {notif.message}
                    </p>


                    <div className="flex items-center justify-between gap-3 flex-wrap">

                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">

                        Type: {notif.notification_type?.replaceAll("_", " ") || "General"}

                      </span>


                      <div className="flex items-center gap-3">

                        <button
                          onClick={() => handleViewNotification(notif)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          View
                        </button>


                        {!notif.is_read && (

                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            disabled={saving}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                          >
                            Mark as read
                          </button>

                        )}


                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          disabled={saving}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}
                {isViewModalOpen && selectedNotification && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">

            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">

                <h3 className="text-lg font-bold text-slate-900">
                  Notification Details
                </h3>

                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedNotification(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>

              </div>


              <div className="p-6 space-y-4">

                <div className="flex items-center gap-3">

                  {getNotificationIcon(selectedNotification.notification_type)}

                  <div>

                    <h2 className="font-bold text-slate-900">
                      {selectedNotification.title}
                    </h2>

                    {getStatusBadge(selectedNotification.notification_type)}

                  </div>

                </div>


                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Message
                  </p>

                  <p className="text-sm text-slate-600 mt-1">
                    {selectedNotification.message}
                  </p>

                </div>


                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Notification Type
                  </p>

                  <p className="text-sm text-slate-700 mt-1">
                    {selectedNotification.notification_type?.replaceAll("_", " ")}
                  </p>

                </div>


                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Date Created
                  </p>

                  <p className="text-sm text-slate-700 mt-1">
                    {selectedNotification.created_at
                      ? new Date(selectedNotification.created_at).toLocaleString()
                      : "Not available"
                    }
                  </p>

                </div>


                <div>

                  <p className="text-xs uppercase font-semibold text-slate-400">
                    Read Status
                  </p>

                  <p className="text-sm text-slate-700 mt-1">
                    {selectedNotification.is_read ? "Read" : "Unread"}
                  </p>

                </div>


                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">

                  {!selectedNotification.is_read && (

                    <button
                      onClick={async () => {

                        await handleMarkAsRead(selectedNotification.id);

                        setSelectedNotification((previous) => ({
                          ...previous,
                          is_read: true,
                        }));

                      }}
                      className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                    >
                      Mark as read
                    </button>

                  )}


                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );

};

export default Notifications;