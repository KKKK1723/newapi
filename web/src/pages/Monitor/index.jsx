import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Tag, Collapsible, Tooltip, Spin } from '@douyinfe/semi-ui';
import {
  Activity,
  Zap,
  Radio,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { API, showError } from '../../helpers';

const { Title, Text } = Typography;

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 天' },
  { value: '15d', label: '15 天' },
  { value: '30d', label: '30 天' },
];

// ─── 状态配色 ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  operational: {
    label: '正常',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
  },
  degraded: {
    label: '延迟',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  failed: {
    label: '错误',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
  },
};

// ─── 可用率颜色 ───────────────────────────────────────────────
function getRateColor(rate) {
  if (rate >= 0.95) return '#22c55e';
  if (rate >= 0.8) return '#f59e0b';
  return '#ef4444';
}

// ─── 历史条形图 ───────────────────────────────────────────────
// 单条探测记录的状态颜色：绿色=流畅 / 橙色=延迟高但可用 / 红色=失败
function getPointColor(point) {
  if (point.status !== 'ok') return '#ef4444'; // 红
  if (point.latency > 5000) return '#f59e0b';  // 橙
  return '#16a34a';                              // 绿
}

function getPointLabel(point) {
  if (point.status !== 'ok') return '异常';
  if (point.latency > 5000) return '缓慢';
  return '正常';
}

function HistoryBarTooltip({ point }) {
  const color = getPointColor(point);
  const label = getPointLabel(point);
  const timeStr = point.time.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div style={{ fontSize: 12, lineHeight: 1.7, minWidth: 130, color: '#333' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
          }}
        />
        <span style={{ fontWeight: 600, color: '#111' }}>{label}</span>
      </div>
      <div style={{ color: '#666' }}>
        <div>时间：{timeStr}</div>
        {point.status === 'ok' ? (
          <>
            <div>延迟：{point.latency} ms</div>
            <div>Ping：{point.ping} ms</div>
          </>
        ) : (
          <div>请求失败</div>
        )}
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
};
const TOOLTIP_ARROW_STYLE = {
  backgroundColor: '#fff',
  borderColor: '#e5e7eb',
};

function HistoryBar({ history }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  return (
    <div className='flex items-end gap-[2px] w-full' style={{ height: 36, paddingTop: 4 }}>
      {history.map((point, i) => {
        const color = getPointColor(point);
        const isHovered = hoveredIdx === i;
        return (
          <Tooltip
            key={i}
            content={<HistoryBarTooltip point={point} />}
            position='top'
            showArrow
            style={TOOLTIP_STYLE}
            arrowStyle={TOOLTIP_ARROW_STYLE}
          >
            <div
              className='flex-1'
              style={{
                minWidth: 2,
                height: 28,
                borderRadius: 2,
                backgroundColor: color,
                opacity: isHovered ? 1 : 0.85,
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'opacity 0.15s, transform 0.15s ease-out',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          </Tooltip>
        );
      })}
    </div>
  );
}

// ─── 单个模型卡片 ─────────────────────────────────────────────
function ModelCard({ model, period }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[model.status] || STATUS_CONFIG.operational;
  const ratePercent = (model.availability.rate * 100).toFixed(2);
  const rateColor = getRateColor(model.availability.rate);

  return (
    <div
      className='flex flex-col overflow-hidden rounded-2xl border'
      style={{
        borderColor: 'var(--semi-color-border)',
        background: 'var(--semi-color-bg-0)',
      }}
    >
      {/* ── 顶部：图标 + 名称 + 状态 ─────────────── */}
      <div className='p-5 pb-0'>
        <div className='flex items-start justify-between mb-1'>
          <div className='flex items-center gap-3'>
            <div
              className='flex h-11 w-11 items-center justify-center rounded-xl'
              style={{
                background: 'var(--semi-color-fill-0)',
                border: '1px solid var(--semi-color-border)',
              }}
            >
              <svg
                viewBox='0 0 24 24'
                width='22'
                height='22'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                style={{ color: 'var(--semi-color-text-0)' }}
              >
                <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
              </svg>
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span
                  className='text-base font-semibold'
                  style={{ color: 'var(--semi-color-text-0)' }}
                >
                  {model.name}
                </span>
                <span
                  className='inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium'
                  style={{
                    color: sc.color,
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                  }}
                >
                  {sc.label}
                </span>
              </div>
              <div className='flex items-center gap-2 mt-0.5'>
                <span
                  className='text-xs'
                  style={{ color: 'var(--semi-color-text-2)' }}
                >
                  {model.provider}
                </span>
                <span
                  className='text-xs font-mono'
                  style={{ color: 'var(--semi-color-text-3)' }}
                >
                  {model.modelId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 指标：延迟 + PING ─────────────────────── */}
      <div className='px-5 pt-4'>
        <div className='grid grid-cols-2 gap-3'>
          <div
            className='rounded-xl p-3'
            style={{ background: 'var(--semi-color-fill-0)' }}
          >
            <div
              className='flex items-center gap-1.5 text-xs mb-1.5'
              style={{ color: 'var(--semi-color-text-2)' }}
            >
              <Zap size={13} />
              对话延迟
            </div>
            <div
              className='text-xl font-bold font-mono'
              style={{ color: 'var(--semi-color-text-0)' }}
            >
              {model.latency}{' '}
              <span className='text-xs font-normal' style={{ color: 'var(--semi-color-text-2)' }}>
                ms
              </span>
            </div>
          </div>
          <div
            className='rounded-xl p-3'
            style={{ background: 'var(--semi-color-fill-0)' }}
          >
            <div
              className='flex items-center gap-1.5 text-xs mb-1.5'
              style={{ color: 'var(--semi-color-text-2)' }}
            >
              <Radio size={13} />
              端点 PING
            </div>
            <div
              className='text-xl font-bold font-mono'
              style={{ color: 'var(--semi-color-text-0)' }}
            >
              {model.ping}{' '}
              <span className='text-xs font-normal' style={{ color: 'var(--semi-color-text-2)' }}>
                ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 上游状态（折叠） ──────────────────────── */}
      <div className='px-5 pt-4'>
        <div
          className='flex items-center justify-between cursor-pointer select-none py-1'
          onClick={() => setExpanded(!expanded)}
        >
          <span
            className='text-xs'
            style={{ color: 'var(--semi-color-text-2)' }}
          >
            上游状态
          </span>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--semi-color-text-3)',
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
        <div
          style={{
            borderBottom: '1px dashed var(--semi-color-border)',
          }}
        />
        <Collapsible isOpen={expanded}>
          <div className='py-3'>
            <div className='flex items-center gap-1.5'>
              {model.status === 'failed' ? (
                <XCircle size={13} color='#ef4444' />
              ) : model.status === 'degraded' ? (
                <Clock size={13} color='#f59e0b' />
              ) : (
                <CheckCircle size={13} color='#22c55e' />
              )}
              <span
                className='text-xs'
                style={{ color: 'var(--semi-color-text-2)' }}
              >
                {model.status === 'failed'
                  ? 'API 服务异常'
                  : model.status === 'degraded'
                    ? 'API 服务响应缓慢'
                    : 'API 服务正常运行中'}
              </span>
            </div>
          </div>
        </Collapsible>
      </div>

      {/* ── 可用性 ────────────────────────────────── */}
      <div className='px-5 pt-1 pb-4'>
        <div className='flex items-center justify-between'>
          <div>
            <div
              className='text-xs mb-0.5'
              style={{ color: 'var(--semi-color-text-2)' }}
            >
              可用性 ({PERIOD_OPTIONS.find((p) => p.value === period)?.label})
            </div>
            <div
              className='text-xs'
              style={{ color: 'var(--semi-color-text-3)' }}
            >
              {model.availability.success}/{model.availability.total} 成功
            </div>
          </div>
          <div className='text-2xl font-bold font-mono' style={{ color: rateColor }}>
            {ratePercent}%
          </div>
        </div>
      </div>

      {/* ── 历史图表 ──────────────────────────────── */}
      <div
        className='px-5 pt-3 pb-4 mt-auto'
        style={{
          borderTop: '1px solid var(--semi-color-border)',
          background: 'var(--semi-color-fill-0)',
        }}
      >
        <div className='flex items-center justify-between mb-3'>
          <span
            className='text-[10px] font-semibold tracking-wider uppercase'
            style={{ color: 'var(--semi-color-text-3)' }}
          >
            History ({model.history.length}pts)
          </span>
          <div
            className='flex items-center gap-1 text-[10px]'
            style={{ color: 'var(--semi-color-text-3)' }}
          >
            <Clock size={10} />
            Next update in 0s
          </div>
        </div>
        {model.history.length > 0 ? (
          <HistoryBar history={model.history} />
        ) : (
          <div
            className='flex items-center justify-center'
            style={{ height: 28, color: 'var(--semi-color-text-3)', fontSize: 12 }}
          >
            暂无历史数据
          </div>
        )}
        <div className='flex items-center justify-between mt-1.5'>
          <span
            className='text-[10px] uppercase'
            style={{ color: 'var(--semi-color-text-3)' }}
          >
            Past
          </span>
          <span
            className='text-[10px] uppercase'
            style={{ color: 'var(--semi-color-text-3)' }}
          >
            Now
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────
export default function Monitor() {
  const [models, setModels] = useState([]);
  const [period, setPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchMonitorData = useCallback(async (currentPeriod) => {
    try {
      console.log('[Monitor] fetching /api/monitor/status?period=' + (currentPeriod || period));
      const res = await API.get('/api/monitor/status', { params: { period: currentPeriod || period } });
      console.log('[Monitor] response:', res.status, res.data);
      const { success, data, message } = res.data;
      if (success && Array.isArray(data)) {
        const processed = data.map((m) => ({
          ...m,
          history: (m.history || []).map((h) => ({
            ...h,
            time: new Date(h.time),
          })),
        }));
        setModels(processed);
        setLastUpdated(new Date());
      } else {
        console.error('[Monitor] API returned failure:', message);
        showError(message || '获取监控数据失败');
      }
    } catch (err) {
      console.error('[Monitor] fetch error:', err);
      showError('获取监控数据失败');
    }
  }, [period]);

  // 初始加载 + period 切换时重新获取
  useEffect(() => {
    setLoading(true);
    fetchMonitorData(period).finally(() => setLoading(false));
  }, [period]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMonitorData(period).finally(() => setRefreshing(false));
  }, [fetchMonitorData, period]);

  // 汇总统计
  const summary = useMemo(() => {
    let ok = 0,
      warn = 0,
      fail = 0;
    models.forEach((m) => {
      if (m.status === 'operational') ok++;
      else if (m.status === 'degraded') warn++;
      else fail++;
    });
    return { ok, warn, fail };
  }, [models]);

  return (
    <div className='mt-[60px] px-2'>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 12px' }}>
        {/* ── Header ───────────────────────────────── */}
        <div className='flex flex-col gap-6 mb-8 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <div
                className='flex h-8 w-8 items-center justify-center rounded-lg'
                style={{
                  background: 'var(--semi-color-primary)',
                  color: '#fff',
                }}
              >
                <Activity size={16} />
              </div>
              <span
                className='text-xs font-bold uppercase tracking-widest'
                style={{ color: 'var(--semi-color-text-2)' }}
              >
                Model Monitor
              </span>
            </div>
            <Title
              heading={2}
              style={{
                marginBottom: 4,
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              模型可用性监测
            </Title>
            <Text
              style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }}
            >
              实时追踪 AI 模型对话接口的可用性、延迟与上游服务状态
            </Text>
          </div>

          {/* ── 右侧控制区 ──────────────────────────── */}
          <div className='flex flex-col items-start gap-3 sm:items-end'>
            {/* 周期切换 */}
            <div
              className='flex items-center gap-2 rounded-full px-2 py-1'
              style={{
                border: '1px solid var(--semi-color-border)',
                background: 'var(--semi-color-bg-0)',
              }}
            >
              <span
                className='pl-1 text-[10px] font-semibold uppercase tracking-wider'
                style={{ color: 'var(--semi-color-text-2)' }}
              >
                可用性区间
              </span>
              <div
                className='flex items-center gap-1 rounded-full p-0.5'
                style={{ background: 'var(--semi-color-fill-0)' }}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => setPeriod(opt.value)}
                    className='rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors'
                    style={
                      period === opt.value
                        ? {
                            background: 'var(--semi-color-primary)',
                            color: '#fff',
                          }
                        : { color: 'var(--semi-color-text-2)' }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 运行状态 */}
            <div
              className='flex items-center gap-2 rounded-full px-3 py-1.5'
              style={{
                border: '1px solid var(--semi-color-border)',
                background: 'var(--semi-color-bg-0)',
              }}
            >
              <span className='relative flex h-2.5 w-2.5'>
                <span
                  className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-75'
                  style={{ background: '#22c55e' }}
                />
                <span
                  className='relative inline-flex h-2.5 w-2.5 rounded-full'
                  style={{ background: '#22c55e' }}
                />
              </span>
              <span
                className='text-xs font-semibold uppercase tracking-wider'
                style={{ color: 'var(--semi-color-text-1)' }}
              >
                {summary.ok} 正常
              </span>
              {summary.warn > 0 && (
                <span className='text-xs' style={{ color: '#f59e0b' }}>
                  · {summary.warn} 延迟
                </span>
              )}
              {summary.fail > 0 && (
                <span className='text-xs' style={{ color: '#ef4444' }}>
                  · {summary.fail} 异常
                </span>
              )}
            </div>

            {/* 更新时间 + 刷新 */}
            <div
              className='flex items-center gap-3 text-xs'
              style={{ color: 'var(--semi-color-text-2)' }}
            >
              <div className='flex items-center gap-1.5'>
                <RefreshCw
                  size={12}
                  className={refreshing ? 'animate-spin' : ''}
                />
                <span>
                  更新于{' '}
                  {lastUpdated.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <button
                type='button'
                onClick={handleRefresh}
                disabled={refreshing}
                className='rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors'
                style={{
                  border: '1px solid var(--semi-color-border)',
                  color: 'var(--semi-color-text-2)',
                  opacity: refreshing ? 0.5 : 1,
                }}
              >
                刷新
              </button>
            </div>
          </div>
        </div>

        {/* ── 卡片网格 ─────────────────────────────── */}
        {loading ? (
          <div className='flex items-center justify-center' style={{ minHeight: 300 }}>
            <Spin size='large' />
          </div>
        ) : models.length === 0 ? (
          <div
            className='flex flex-col items-center justify-center'
            style={{ minHeight: 300, color: 'var(--semi-color-text-3)' }}
          >
            <Activity size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <Text style={{ color: 'var(--semi-color-text-3)', fontSize: 14 }}>
              暂无监控数据，请等待探测完成
            </Text>
          </div>
        ) : (
          <div className='grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3'>
            {models.map((m) => (
              <ModelCard key={m.id} model={m} period={period} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
