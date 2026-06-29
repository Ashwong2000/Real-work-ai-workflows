---
name: market-research-report-generator
description: 市场调研报告生成技能。基于结构化的统计学数据、参考报告和原始问卷数据，输出包含完整发现、数据证据、业务动作和限制说明的专业市场调研报告。适用于产品用户画像、使用场景、功能偏好、渠道分析等研究。
---

# Market Research Report Generator

This skill guides the generation of professional market research reports from structured statistical data, survey results, and reference materials.

## When to use this skill

Use this skill when the user provides statistical analysis data (e.g., from Excel/CSV), reference reports, or raw survey data, and requests a comprehensive market research report. This is particularly useful for generating reports on user personas, usage scenarios, product feature preferences, and purchase motivations.

## Core Principles

1. **Evidence-Based Conclusions**: Every finding MUST be supported by specific data points (Count, Percentage, Valid N, p-value, Cramer's V, etc.).
2. **Distinguish Correlation from Causation**: Never present statistical correlation as causal relationships.
3. **Actionable Business Insights**: Findings must translate into concrete business actions (e.g., product optimization, marketing strategy, community operations).
4. **Acknowledge Limitations**: Always state the sample scope, potential biases, and limitations of the data.
5. **Follow the Standard Structure**: Use the "Finding → Data Evidence → Interpretation → Business Action → Limitation" structure for all conclusions.

## Workflow

Follow these steps to generate a market research report:

### Step 1: Data Ingestion & Understanding
1. Read the provided statistical data files (Excel/CSV). Pay special attention to sheets containing Basic Statistics, Crosstab/Chi-square, Spearman correlation, and Conclusion Evidence.
2. Review any provided reference reports (PDF/PPTX) to understand the expected tone, visual style, and industry context.
3. Read the `references/metrics_guide.md` to ensure correct interpretation of statistical indicators.

### Step 2: Data Synthesis & Key Findings Extraction
1. Identify the core questions the report needs to answer (e.g., Who is the user? How do they use the product? Why do they choose it?).
2. Extract the most significant data points that answer these questions.
3. Group related findings into logical sections (e.g., Demographic Profile, Usage Scenarios, Product Preferences, Channel Behavior).

### Step 3: Report Structuring & Drafting
1. Follow the template provided in `templates/report_template.md`.
2. For each key finding, apply the strict 5-part structure:
   - **发现 (Finding)**: A clear, one-sentence summary of the insight.
   - **数据证据 (Data Evidence)**: The specific numbers supporting the finding.
   - **解释 (Interpretation)**: What this means in the context of the market.
   - **业务动作 (Business Action)**: Concrete recommendations for the business.
   - **限制说明 (Limitation)**: Caveats regarding the data source or sample size.

### Step 4: Persona Development (If applicable)
1. If the data includes cluster analysis or distinct user groups, create detailed User Personas.
2. Ensure personas are based on data, not assumptions. Include sample size, key characteristics, and specific business implications for each persona.

### Step 5: Review and Refine
1. Check against the Core Principles. Are correlations stated correctly? Are business actions specific?
2. Ensure the tone is professional, objective, and analytical.

## Required Resources

When executing this skill, refer to these bundled resources as needed:

- **`references/metrics_guide.md`**: Guide for interpreting statistical metrics (p-value, Cramer's V, Spearman ρ, Support/Confidence/Lift). Read this if you need clarification on how to interpret the data.
- **`templates/report_template.md`**: The required Markdown structure for the final output report.

## Prohibited Actions

- DO NOT claim survey samples represent the entire market population.
- DO NOT present correlations as causal relationships.
- DO NOT draw firm conclusions from statistically insignificant data or very small sample sizes without strong caveats.
- DO NOT invent personas without clear data evidence supporting the cluster.
- DO NOT provide business recommendations without stating the data limitations.
