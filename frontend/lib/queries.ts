// ES|QL queries copied verbatim from setup_agent_builder.py lines 76-150.
// Parameterized queries use ES|QL ?param syntax with the JS client's params option.

export const ESQL_QUERIES = {
  correlated_events_by_ip: `FROM security-alerts
| WHERE source.ip == ?
| WHERE @timestamp >= NOW() - 24 HOURS
| SORT @timestamp ASC
| KEEP @timestamp, message, source.ip, destination.ip, event.category, event.action, event.severity, threat.technique.id, threat.technique.name, host.name, user.name, process.name, alert.severity
| LIMIT 200`,

  lateral_movement_detection: `FROM security-alerts
| WHERE event.category == "authentication"
  AND event.outcome == "success"
  AND @timestamp >= NOW() - 24 HOURS
| STATS host_count = COUNT_DISTINCT(destination.ip), hosts = VALUES(host.name), first_seen = MIN(@timestamp), last_seen = MAX(@timestamp) BY source.ip, user.name
| WHERE host_count >= 2
| SORT host_count DESC
| LIMIT 50`,

  beaconing_detection: `FROM security-alerts
| WHERE event.category == "network"
  AND network.direction == "outbound"
  AND @timestamp >= NOW() - 24 HOURS
| STATS beacon_count = COUNT(*), total_bytes = SUM(source.bytes), first_seen = MIN(@timestamp), last_seen = MAX(@timestamp) BY destination.ip, destination.domain, source.ip
| WHERE beacon_count >= 5
| EVAL duration_minutes = DATE_DIFF("minutes", first_seen, last_seen)
| EVAL avg_interval_seconds = CASE(beacon_count > 1, duration_minutes * 60.0 / (beacon_count - 1), 0)
| WHERE avg_interval_seconds > 0 AND avg_interval_seconds < 600
| SORT beacon_count DESC
| LIMIT 20`,

  process_chain_analysis: `FROM security-alerts
| WHERE event.category == "process"
  AND host.name == ?
  AND @timestamp >= NOW() - 24 HOURS
| SORT @timestamp ASC
| KEEP @timestamp, process.name, process.pid, process.command_line, process.parent.name, process.parent.pid, user.name, event.action, threat.technique.id, alert.severity
| LIMIT 100`,
};
