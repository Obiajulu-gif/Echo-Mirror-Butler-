import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth-context";
import type { LogEntry } from "../../lib/types";
import { formatDate, moodToEmoji } from "../../lib/date";
import { HabitTrackerWidget } from "./components/habit-tracker-widget";
import { MoodChartWidget } from "./components/mood-chart-widget";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const streakQuery = useQuery({
    queryKey: ["dashboard-streak", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc("get_current_streak", {
        user_id: user.id,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    enabled: !!user,
  });

  const recentLogsQuery = useQuery({
    queryKey: ["logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("log_entries")
        .select("id, date, mood, notes")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as LogEntry[];
    },
    enabled: !!user,
  });

  const insightQuery = useQuery({
    queryKey: ["dashboard-insight", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("ai_insights")
        .select("id, prediction, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentStreak = streakQuery.data ?? 0;

  if (!user) {
    return null;
  }

  return (
    <section className="feature-grid">
      {/* Mood Chart - spans 2 columns */}
      <MoodChartWidget />

      {/* Mood Streak Card */}
      <article className="card">
        <div className="card-header">
          <h3>Mood Streak</h3>
        </div>
        <div className="card-content">
          {streakQuery.isLoading && <div className="skeleton-line" />}
          {streakQuery.isError && (
            <div>
              <p className="muted">Streak unavailable</p>
              <h2>Start your streak today</h2>
            </div>
          )}
          {streakQuery.isSuccess && currentStreak === 0 && (
            <div>
              <p className="muted">Current streak</p>
              <h2>Start your streak today</h2>
            </div>
          )}
          {streakQuery.isSuccess && currentStreak > 0 && (
            <div>
              <p className="muted">Current streak</p>
              <h2>🔥 {currentStreak}-day streak</h2>
            </div>
          )}
        </div>
      </article>

      {/* Habit Tracker Widget */}
      <HabitTrackerWidget />

      {/* Recent Logs Card */}
      <article className="card">
        <div className="card-header">
          <h3>Recent Logs</h3>
        </div>
        <div className="card-content">
          {recentLogsQuery.isLoading && <p className="muted">Loading…</p>}
          {recentLogsQuery.data && recentLogsQuery.data.length === 0 && (
            <p className="muted">No logs yet</p>
          )}
          {recentLogsQuery.data && recentLogsQuery.data.length > 0 && (
            <div className="list-card">
              {recentLogsQuery.data.map((log) => (
                <div
                  key={log.id}
                  className="list-item"
                  onClick={() => navigate(`/logs/${log.id}/edit`)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="muted">
                    {formatDate(log.date)}
                  </span>
                  <span>{moodToEmoji(log.mood)}</span>
                  <span className="muted">
                    {log.notes ? log.notes.substring(0, 80) : "No notes"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* AI Insight Card */}
      <article className="card">
        <div className="card-header">
          <h3>Latest Insight</h3>
        </div>
        <div className="card-content">
          {insightQuery.isLoading && <p className="muted">Loading…</p>}
          {insightQuery.data ? (
            <>
              <p>{insightQuery.data.prediction.substring(0, 200)}</p>
              <button type="button" onClick={() => navigate("/insights")}>
                View full insight
              </button>
            </>
          ) : (
            <>
              <p className="muted">No insights yet</p>
              <button type="button" onClick={() => navigate("/insights")}>
                Generate insights
              </button>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
