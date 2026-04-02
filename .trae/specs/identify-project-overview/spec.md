# 项目概览识别 Spec

## Why
为快速理解当前仓库的用途与主要功能，提供一次性、非侵入的项目概览输出，帮助用户在不阅读大量代码的情况下把握核心信息。

## What Changes
- 增加“项目概览识别”能力：自动扫描代码与配置，生成中文简要说明与要点。
- 输出包括：一句话概览（≤150字）、技术栈、启动方式、主要模块/目录。
- 非侵入式，**不修改**现有代码；仅在对话中返回结果。

## Impact
- Affected specs: 项目分析与文档能力
- Affected code: 不涉及功能代码；通过检索与读取进行分析

## ADDED Requirements
### Requirement: 项目概览
系统 SHALL 通过扫描仓库关键文件与目录，生成简洁中文概览（≤150字）与要点列表（技术栈、运行方式、主要模块）。

#### Scenario: Success case
- WHEN 用户提出“看一下当前这个项目是做什么的”
- THEN 返回概览、技术栈、启动方式、主要模块要点；若无法确定，说明不确定点并给出下一步建议

## MODIFIED Requirements
无

## REMOVED Requirements
无
