"use client";

export default function ArchitectureDiagram() {
  return (
    <div className="relative">
      {/* Section label */}
      <h2 className="font-display font-bold text-[clamp(2rem,6vw,5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary/90 mb-8">
        Architecture
      </h2>

      <div className="relative bg-base-dark/40 border border-divider overflow-hidden">
        {/* Top accent bar */}
        <div className="h-[3px] w-full bg-accent-red" />

        <div className="p-6 md:p-10">
          <svg
            viewBox="0 0 960 620"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            style={{ maxHeight: "620px" }}
          >
            {/* ============================================ */}
            {/* DEFS: markers, gradients, filters            */}
            {/* ============================================ */}
            <defs>
              <marker
                id="arrow-red"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0,1 8,4 0,7" fill="#DB4A2B" />
              </marker>
              <marker
                id="arrow-orange"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0,1 8,4 0,7" fill="#F8A348" />
              </marker>
              <marker
                id="arrow-primary"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0,1 8,4 0,7" fill="#1E1E1E" opacity="0.5" />
              </marker>

              {/* Subtle shadow filter */}
              <filter id="shadow-sm" x="-4%" y="-4%" width="108%" height="108%">
                <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#1E1E1E" floodOpacity="0.12" />
              </filter>

              {/* Animated dash pattern */}
              <pattern id="dash-animated" width="12" height="1" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0.5" x2="6" y2="0.5" stroke="#DB4A2B" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* ============================================ */}
            {/* LAYER 1: ELASTIC AGENT BUILDER (top)         */}
            {/* ============================================ */}
            <g filter="url(#shadow-sm)">
              {/* Outer frame */}
              <rect x="60" y="20" width="840" height="170" fill="#E4E2DD" stroke="#1E1E1E" strokeWidth="2" />
              {/* Top accent */}
              <rect x="60" y="20" width="840" height="4" fill="#DB4A2B" />
              {/* Label */}
              <text x="480" y="52" textAnchor="middle" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="14" fill="#1E1E1E" letterSpacing="0.15em">
                ELASTIC AGENT BUILDER
              </text>
              {/* Subtitle */}
              <text x="480" y="68" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="10" fill="#444444" opacity="0.6" letterSpacing="0.08em">
                KIBANA REST API  /  CUSTOM AGENT + CUSTOM TOOLS
              </text>

              {/* Tool cards row */}
              {/* ES|QL Tool 1 */}
              <rect x="90" y="86" width="120" height="84" fill="#D9D6D0" stroke="rgba(30,30,30,0.12)" strokeWidth="1" />
              <rect x="90" y="86" width="120" height="3" fill="#F8A348" />
              <text x="150" y="108" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#F8A348" letterSpacing="0.15em">
                ES|QL
              </text>
              <text x="150" y="124" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Correlated
              </text>
              <text x="150" y="136" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Events
              </text>
              <text x="150" y="155" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#444444" opacity="0.5">
                Timeline by IP
              </text>

              {/* ES|QL Tool 2 */}
              <rect x="225" y="86" width="120" height="84" fill="#D9D6D0" stroke="rgba(30,30,30,0.12)" strokeWidth="1" />
              <rect x="225" y="86" width="120" height="3" fill="#F8A348" />
              <text x="285" y="108" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#F8A348" letterSpacing="0.15em">
                ES|QL
              </text>
              <text x="285" y="124" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Lateral
              </text>
              <text x="285" y="136" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Movement
              </text>
              <text x="285" y="155" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#444444" opacity="0.5">
                Multi-host auth
              </text>

              {/* ES|QL Tool 3 */}
              <rect x="360" y="86" width="120" height="84" fill="#D9D6D0" stroke="rgba(30,30,30,0.12)" strokeWidth="1" />
              <rect x="360" y="86" width="120" height="3" fill="#F8A348" />
              <text x="420" y="108" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#F8A348" letterSpacing="0.15em">
                ES|QL
              </text>
              <text x="420" y="124" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Beaconing
              </text>
              <text x="420" y="136" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Detection
              </text>
              <text x="420" y="155" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#444444" opacity="0.5">
                C2 beacon patterns
              </text>

              {/* ES|QL Tool 4 */}
              <rect x="495" y="86" width="120" height="84" fill="#D9D6D0" stroke="rgba(30,30,30,0.12)" strokeWidth="1" />
              <rect x="495" y="86" width="120" height="3" fill="#F8A348" />
              <text x="555" y="108" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#F8A348" letterSpacing="0.15em">
                ES|QL
              </text>
              <text x="555" y="124" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Process
              </text>
              <text x="555" y="136" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Chain
              </text>
              <text x="555" y="155" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#444444" opacity="0.5">
                Parent-child trees
              </text>

              {/* Search Tool */}
              <rect x="630" y="86" width="120" height="84" fill="#D9D6D0" stroke="rgba(30,30,30,0.12)" strokeWidth="1" />
              <rect x="630" y="86" width="120" height="3" fill="#DB4A2B" />
              <text x="690" y="108" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#DB4A2B" letterSpacing="0.15em">
                SEARCH
              </text>
              <text x="690" y="124" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Threat Intel
              </text>
              <text x="690" y="136" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Lookup
              </text>
              <text x="690" y="155" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#444444" opacity="0.5">
                IOC + MITRE match
              </text>

              {/* Workflow Tool */}
              <rect x="765" y="86" width="120" height="84" fill="#D9D6D0" stroke="rgba(30,30,30,0.12)" strokeWidth="1" />
              <rect x="765" y="86" width="120" height="3" fill="#1E1E1E" />
              <text x="825" y="108" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#1E1E1E" letterSpacing="0.15em">
                WORKFLOW
              </text>
              <text x="825" y="124" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Incident
              </text>
              <text x="825" y="136" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" letterSpacing="0.04em">
                Response
              </text>
              <text x="825" y="155" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#444444" opacity="0.5">
                Auto triage workflow
              </text>
            </g>

            {/* ============================================ */}
            {/* CONNECTING ARROWS: tools -> agent brain       */}
            {/* ============================================ */}

            {/* Vertical lines from each tool down to agent brain */}
            <line x1="150" y1="170" x2="150" y2="260" stroke="#F8A348" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1="285" y1="170" x2="285" y2="260" stroke="#F8A348" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1="420" y1="170" x2="420" y2="260" stroke="#F8A348" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1="555" y1="170" x2="555" y2="260" stroke="#F8A348" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1="690" y1="170" x2="690" y2="260" stroke="#DB4A2B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1="825" y1="170" x2="825" y2="260" stroke="#1E1E1E" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.25">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.5s" repeatCount="indefinite" />
            </line>

            {/* Horizontal collector line */}
            <line x1="150" y1="260" x2="825" y2="260" stroke="#1E1E1E" strokeWidth="1.5" opacity="0.15" />

            {/* Central drop line to agent brain */}
            <line x1="480" y1="260" x2="480" y2="290" stroke="#1E1E1E" strokeWidth="2" opacity="0.3" markerEnd="url(#arrow-primary)" />

            {/* ============================================ */}
            {/* LAYER 2: AGENT BRAIN (center)                */}
            {/* ============================================ */}
            <g filter="url(#shadow-sm)">
              <rect x="290" y="295" width="380" height="120" fill="#1E1E1E" stroke="#1E1E1E" strokeWidth="2" />
              {/* Top accent */}
              <rect x="290" y="295" width="380" height="4" fill="#DB4A2B" />

              {/* Brain icon (simplified gear/brain shape) */}
              <circle cx="340" cy="355" r="18" fill="none" stroke="#DB4A2B" strokeWidth="1.5" opacity="0.8" />
              <circle cx="340" cy="355" r="8" fill="#DB4A2B" opacity="0.6" />
              {/* Pulse ring animation */}
              <circle cx="340" cy="355" r="18" fill="none" stroke="#DB4A2B" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>

              <text x="380" y="345" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="14" fill="#E4E2DD" letterSpacing="0.12em">
                DCO TRIAGE AGENT
              </text>
              <text x="380" y="365" fontFamily="'Satoshi', sans-serif" fontSize="10" fill="#E4E2DD" opacity="0.5" letterSpacing="0.06em">
                Autonomous 6-step reasoning chain
              </text>

              {/* 6 step chain indicators */}
              <g>
                {/* Step boxes */}
                <rect x="310" y="382" width="52" height="18" fill="#DB4A2B" opacity="0.2" />
                <text x="336" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#DB4A2B" letterSpacing="0.08em">
                  CORRELATE
                </text>

                <text x="367" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#E4E2DD" opacity="0.25">
                  {"\u2192"}
                </text>

                <rect x="374" y="382" width="42" height="18" fill="#F8A348" opacity="0.2" />
                <text x="395" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#F8A348" letterSpacing="0.08em">
                  ENRICH
                </text>

                <text x="421" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#E4E2DD" opacity="0.25">
                  {"\u2192"}
                </text>

                <rect x="428" y="382" width="42" height="18" fill="#DB4A2B" opacity="0.2" />
                <text x="449" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#DB4A2B" letterSpacing="0.08em">
                  DETECT
                </text>

                <text x="475" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#E4E2DD" opacity="0.25">
                  {"\u2192"}
                </text>

                <rect x="482" y="382" width="50" height="18" fill="#F8A348" opacity="0.2" />
                <text x="507" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#F8A348" letterSpacing="0.08em">
                  FORENSIC
                </text>

                <text x="537" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#E4E2DD" opacity="0.25">
                  {"\u2192"}
                </text>

                <rect x="544" y="382" width="40" height="18" fill="#DB4A2B" opacity="0.2" />
                <text x="564" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#DB4A2B" letterSpacing="0.08em">
                  SCORE
                </text>

                <text x="589" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="8" fill="#E4E2DD" opacity="0.25">
                  {"\u2192"}
                </text>

                <rect x="596" y="382" width="48" height="18" fill="#F8A348" opacity="0.2" />
                <text x="620" y="394" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#F8A348" letterSpacing="0.08em">
                  REPORT
                </text>
              </g>
            </g>

            {/* ============================================ */}
            {/* CONNECTING ARROWS: agent brain -> indices     */}
            {/* ============================================ */}

            {/* Three lines from agent brain down to indices */}
            <line x1="380" y1="415" x2="220" y2="480" stroke="#DB4A2B" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" markerEnd="url(#arrow-red)">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="480" y1="415" x2="480" y2="480" stroke="#F8A348" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" markerEnd="url(#arrow-orange)">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="580" y1="415" x2="740" y2="480" stroke="#DB4A2B" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" markerEnd="url(#arrow-red)">
              <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="1.2s" repeatCount="indefinite" />
            </line>

            {/* Flow direction labels */}
            <text x="280" y="450" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#DB4A2B" opacity="0.6" letterSpacing="0.1em" transform="rotate(-20, 280, 450)">
              QUERY
            </text>
            <text x="480" y="458" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#F8A348" opacity="0.6" letterSpacing="0.1em">
              ENRICH
            </text>
            <text x="680" y="450" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="7" fill="#DB4A2B" opacity="0.6" letterSpacing="0.1em" transform="rotate(20, 680, 450)">
              LOG
            </text>

            {/* ============================================ */}
            {/* LAYER 3: ELASTICSEARCH INDICES (bottom)       */}
            {/* ============================================ */}

            {/* Index 1: security-alerts */}
            <g filter="url(#shadow-sm)">
              <rect x="80" y="485" width="260" height="110" fill="#E4E2DD" stroke="#1E1E1E" strokeWidth="2" />
              <rect x="80" y="485" width="260" height="4" fill="#DB4A2B" />

              {/* Index icon */}
              <rect x="104" y="508" width="20" height="20" fill="#DB4A2B" opacity="0.15" />
              <rect x="108" y="512" width="12" height="3" fill="#DB4A2B" opacity="0.6" />
              <rect x="108" y="517" width="8" height="3" fill="#DB4A2B" opacity="0.4" />
              <rect x="108" y="522" width="10" height="3" fill="#DB4A2B" opacity="0.3" />

              <text x="134" y="521" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="12" fill="#1E1E1E" letterSpacing="0.06em">
                security-alerts
              </text>

              <text x="104" y="548" fontFamily="'Satoshi', sans-serif" fontSize="9" fill="#444444" opacity="0.6" letterSpacing="0.05em">
                ECS-compatible security events
              </text>
              <text x="104" y="562" fontFamily="'Satoshi', sans-serif" fontSize="9" fill="#444444" opacity="0.6" letterSpacing="0.05em">
                105 documents  |  MITRE ATT&CK mapped
              </text>

              {/* Doc count badge */}
              <rect x="270" y="505" width="50" height="22" fill="#DB4A2B" opacity="0.1" />
              <text x="295" y="520" textAnchor="middle" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="12" fill="#DB4A2B">
                105
              </text>
              <text x="295" y="530" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="6" fill="#DB4A2B" opacity="0.6" letterSpacing="0.1em">
                DOCS
              </text>
            </g>

            {/* Index 2: threat-intel */}
            <g filter="url(#shadow-sm)">
              <rect x="355" y="485" width="250" height="110" fill="#E4E2DD" stroke="#1E1E1E" strokeWidth="2" />
              <rect x="355" y="485" width="250" height="4" fill="#F8A348" />

              {/* Index icon */}
              <rect x="379" y="508" width="20" height="20" fill="#F8A348" opacity="0.15" />
              <rect x="383" y="512" width="12" height="3" fill="#F8A348" opacity="0.6" />
              <rect x="383" y="517" width="8" height="3" fill="#F8A348" opacity="0.4" />
              <rect x="383" y="522" width="10" height="3" fill="#F8A348" opacity="0.3" />

              <text x="409" y="521" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="12" fill="#1E1E1E" letterSpacing="0.06em">
                threat-intel
              </text>

              <text x="379" y="548" fontFamily="'Satoshi', sans-serif" fontSize="9" fill="#444444" opacity="0.6" letterSpacing="0.05em">
                MITRE ATT&CK IOC database
              </text>
              <text x="379" y="562" fontFamily="'Satoshi', sans-serif" fontSize="9" fill="#444444" opacity="0.6" letterSpacing="0.05em">
                18 indicators  |  Hybrid search
              </text>

              {/* Doc count badge */}
              <rect x="539" y="505" width="46" height="22" fill="#F8A348" opacity="0.1" />
              <text x="562" y="520" textAnchor="middle" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="12" fill="#F8A348">
                18
              </text>
              <text x="562" y="530" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="6" fill="#F8A348" opacity="0.6" letterSpacing="0.1em">
                IOCS
              </text>
            </g>

            {/* Index 3: incident-log */}
            <g filter="url(#shadow-sm)">
              <rect x="620" y="485" width="260" height="110" fill="#E4E2DD" stroke="#1E1E1E" strokeWidth="2" />
              <rect x="620" y="485" width="260" height="4" fill="#1E1E1E" />

              {/* Index icon */}
              <rect x="644" y="508" width="20" height="20" fill="#1E1E1E" opacity="0.1" />
              <rect x="648" y="512" width="12" height="3" fill="#1E1E1E" opacity="0.4" />
              <rect x="648" y="517" width="8" height="3" fill="#1E1E1E" opacity="0.3" />
              <rect x="648" y="522" width="10" height="3" fill="#1E1E1E" opacity="0.2" />

              <text x="674" y="521" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="12" fill="#1E1E1E" letterSpacing="0.06em">
                incident-log
              </text>

              <text x="644" y="548" fontFamily="'Satoshi', sans-serif" fontSize="9" fill="#444444" opacity="0.6" letterSpacing="0.05em">
                Triage reports and response actions
              </text>
              <text x="644" y="562" fontFamily="'Satoshi', sans-serif" fontSize="9" fill="#444444" opacity="0.6" letterSpacing="0.05em">
                Auto-generated  |  Audit trail
              </text>

              {/* Status badge */}
              <rect x="812" y="505" width="48" height="22" fill="#1E1E1E" opacity="0.08" />
              <text x="836" y="520" textAnchor="middle" fontFamily="'Clash Display', sans-serif" fontWeight="700" fontSize="10" fill="#1E1E1E" opacity="0.6">
                LOG
              </text>
            </g>

            {/* ============================================ */}
            {/* SIDE LABELS                                   */}
            {/* ============================================ */}

            {/* Left side bracket labels */}
            <text x="35" y="110" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#1E1E1E" opacity="0.2" letterSpacing="0.15em" transform="rotate(-90, 35, 110)">
              TOOLS
            </text>
            <text x="35" y="355" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#1E1E1E" opacity="0.2" letterSpacing="0.15em" transform="rotate(-90, 35, 355)">
              AGENT
            </text>
            <text x="35" y="540" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#1E1E1E" opacity="0.2" letterSpacing="0.15em" transform="rotate(-90, 35, 540)">
              DATA
            </text>

            {/* Right side: data flow direction */}
            <text x="930" y="260" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontWeight="700" fontSize="8" fill="#DB4A2B" opacity="0.3" letterSpacing="0.15em" transform="rotate(-90, 930, 260)">
              DATA FLOW
            </text>
            <line x1="940" y1="180" x2="940" y2="340" stroke="#DB4A2B" strokeWidth="1" opacity="0.15" markerEnd="url(#arrow-red)" />
          </svg>

          {/* Bottom summary */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] text-muted/50 uppercase tracking-[0.12em]">
            <span className="flex items-center gap-2">
              <span className="w-3 h-[3px] bg-accent-orange inline-block" />
              ES|QL Tools (4)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-[3px] bg-accent-red inline-block" />
              Search Tools (1)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-[3px] bg-primary inline-block" />
              Workflow Tools (1)
            </span>
            <span className="w-px h-3 bg-divider" />
            <span>3 Elasticsearch Indices</span>
            <span className="w-px h-3 bg-divider" />
            <span>6-Step Autonomous Reasoning</span>
          </div>
        </div>
      </div>
    </div>
  );
}
