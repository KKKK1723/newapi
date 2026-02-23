import React from 'react';
import { Avatar, Typography, Card, Divider } from '@douyinfe/semi-ui';
import {
  IconAlertTriangle,
} from '@douyinfe/semi-icons';
import {
  ShieldAlert,
  MessageCircleWarning,
  Zap,
  TrendingDown,
  ServerCrash,
  BadgeDollarSign,
} from 'lucide-react';

const { Text, Title } = Typography;

const reasons = [
  {
    icon: <BadgeDollarSign size={20} />,
    text: '站点价格太贵，性价比不满意',
  },
  {
    icon: <TrendingDown size={20} />,
    text: '余额消耗速度过快，与预期不符',
  },
  {
    icon: <Zap size={20} />,
    text: '站点请求速度慢，影响使用体验',
  },
  {
    icon: <ServerCrash size={20} />,
    text: '上游服务经常宕机，稳定性不足',
  },
  {
    icon: <MessageCircleWarning size={20} />,
    text: '其他任何让您觉得不满意的问题',
  },
];

const RefundCard = ({ t }) => {
  return (
    <Card className='!rounded-2xl shadow-sm border-0 h-full'>
      {/* 卡片头部 */}
      <div className='flex items-center mb-4'>
        <Avatar
          size='small'
          shape='square'
          style={{
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            marginRight: 12,
          }}
        >
          <ShieldAlert size={16} color='#fff' />
        </Avatar>
        <div>
          <Text strong style={{ fontSize: 20 }}>
            {t('退款说明')}
          </Text>
          <br />
          <Text type='tertiary' strong style={{ fontSize: 14 }}>
            {t('不满意随时可退')}
          </Text>
        </div>
      </div>

      <Divider margin={12} />

      {/* 说明内容 */}
      <div className='space-y-3'>
        <div
          className='flex items-start gap-2 px-3 py-2 rounded-lg'
          style={{ background: 'var(--semi-color-warning-light-default)' }}
        >
          <IconAlertTriangle
            size='extra-large'
            style={{ color: 'var(--semi-color-warning)', flexShrink: 0, marginTop: 2 }}
          />
          <Text strong style={{ fontSize: 14, lineHeight: 1.7 }}>
            {t('如果您在使用过程中遇到以下任何问题，请直接联系管理员申请退款，我们承诺无条件处理。')}
          </Text>
        </div>

        <div className='space-y-2 mt-3'>
          {reasons.map((item, idx) => (
            <div
              key={idx}
              className='flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors'
              style={{
                background: 'var(--semi-color-fill-0)',
              }}
            >
              <span style={{ color: 'var(--semi-color-text-2)', flexShrink: 0 }}>
                {item.icon}
              </span>
              <Text strong style={{ fontSize: 14 }}>{t(item.text)}</Text>
            </div>
          ))}
        </div>
      </div>

      <Divider margin={16} />

      {/* 联系方式 */}
      <div
        className='flex flex-col items-center gap-2 px-4 py-4 rounded-xl'
        style={{
          background: 'linear-gradient(135deg, rgba(var(--semi-orange-0), 1), rgba(var(--semi-red-0), 1))',
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          {t('请速速联系管理员，直接退款')}
        </Text>
        <div className='flex items-center gap-2 mt-1'>
          <img
            src='https://img.icons8.com/color/24/qq.png'
            alt='QQ'
            style={{ width: 24, height: 24 }}
          />
          <Text
            copyable
            strong
            style={{ fontSize: 24, color: 'var(--semi-color-primary)' }}
          >
            2052436429
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default RefundCard;
