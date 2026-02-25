# Initializer Task

You are the **Initializer Agent** for the DCO Threat Triage Agent hackathon project.

## Your Job

Run the following scripts **in order** to set up the complete Elasticsearch environment:

### Step 1: Verify Elasticsearch Connectivity
```bash
python es_client.py
```
This verifies the connection to Elastic Cloud using `ELASTIC_CLOUD_ID` and `ELASTIC_API_KEY` from the environment. If it fails, check credentials before proceeding.

### Step 2: Create Index Mappings
```bash
python create_indices.py
```
Creates three Elasticsearch indices with ECS-compatible mappings:
- `security-alerts` — for simulated security events
- `threat-intel` — for MITRE ATT&CK-mapped IOCs
- `incident-log` — for agent-generated triage reports

### Step 3: Load Attack Chain Data
```bash
python load_attack_data.py
```
Loads ~25 attack events across 5 MITRE ATT&CK stages plus ~80 benign noise events into the `security-alerts` index.

### Step 4: Load Threat Intelligence
```bash
python load_threat_intel.py
```
Loads 15-20 MITRE ATT&CK-mapped IOCs into the `threat-intel` index. These correspond to the simulated attack chain.

### Step 5: Set Up Agent Builder
```bash
python setup_agent_builder.py
```
Creates ES|QL tools, a Search tool, and the DCO Triage Agent in Elastic Agent Builder via the Kibana REST API.

## After All Steps

Once all scripts complete successfully:

1. Create `task_tracker.json` marking all setup tasks as "passing"
2. Write a `CLAUDE.md` file summarizing what was set up
3. Confirm the `.elastic_project.json` marker exists

## Error Handling

If any step fails:
- Print the full error with context
- Do NOT continue to the next step
- Record the failure in task_tracker.json
- Suggest remediation steps
