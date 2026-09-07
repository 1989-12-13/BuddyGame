export const CAMPAIGN = [
  { id: 'falls_elderly', chapter: '01', title: '电话那头的邻居', focus: '先找到需要帮助的人', note: '第一次独立值班。邻居的来电有些着急，一句清楚的问题，可以让救援更近一步。', takeaway: '报告地点时，补充楼栋、入口和明显地标。' },
  { id: 'chest_pain', chapter: '02', title: '说清楚，再快一点', focus: '听见描述里的关键信息', note: '熟悉了工作台，这次试着抓住重点。记录已知事实，不确定的地方再确认。', takeaway: '向接线员描述观察到的情况，不急着替患者下诊断。' },
  { id: 'hemorrhage', chapter: '03', title: '请跟着我的声音', focus: '把指令说得简单、具体', note: '救护车在路上。你留在电话这头，让来电者知道接下来可以做什么。', takeaway: '保持通话，按调度员的指导行动，并及时报告变化。' },
  { id: 'stroke', chapter: '04', title: '记住那个时间', focus: '确认时间敏感的线索', note: '城市仍在运转。一条准确的信息，一次有依据的路线选择，都能帮助接下来的交接。', takeaway: '准确报告症状出现或最后一次正常的时间。' },
  { id: 'cardiac_arrest', chapter: '05', title: '直到有人接过你的手', focus: '问询、派车、指导与交接', note: '最后一通来电。把前几通学到的事串起来，直到现场人员接手。', takeaway: '及时呼救，描述意识和呼吸情况，并配合电话急救指导。' },
] as const
export const CAMPAIGN_IDS = CAMPAIGN.map(chapter => chapter.id)
