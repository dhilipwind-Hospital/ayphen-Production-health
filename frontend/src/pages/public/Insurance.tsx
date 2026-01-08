import React from 'react';
import { Tabs, Card, Row, Col, List, Tag, Statistic, Form, InputNumber, Button, Select, Divider, Table, Alert, Skeleton, Checkbox, Space } from 'antd';
import { listPlans, calculatePremium, listClaims, dashboard, purchase as purchasePlan, comparePlans, familyCalc } from '../../services/insurance';
import type { Plan } from '../../types/insurance';
import { useAuth } from '../../contexts/AuthContext';
import { INSURANCE_USE_MOCK } from '../../config/insurance';
import { useSearchParams } from 'react-router-dom';
import { getAllCountries } from '../../constants/countries';
import type { Country } from '../../constants/countries';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

const COMPARE_STORAGE_KEY = 'comparePlanIds';
const COUNTRY_STORAGE_KEY = 'insuranceCountry';
const SORT_STORAGE_KEY = 'insuranceSort';

// Local helper to render emoji flag from ISO-2 code
const toFlag = (code?: string) => {
  const cc = String(code || '').toUpperCase();
  if (cc.length !== 2) return '';
  try { return String.fromCodePoint(...Array.from(cc).map(ch => 127397 + ch.charCodeAt(0))); } catch { return cc; }
};

const PlansTab: React.FC<{ goToCompare: () => void }> = ({ goToCompare }) => {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sp, setSp] = useSearchParams();
  const [country, setCountry] = React.useState<string>(() => {
    try {
      const qp = (sp.get('country') || '').toUpperCase();
      if (qp) return qp;
      return localStorage.getItem(COUNTRY_STORAGE_KEY) || 'ALL';
    } catch { return 'ALL'; }
  });
  const [insurer, setInsurer] = React.useState<string>('all');
  const [coverage, setCoverage] = React.useState<string>('all');
  const [maxPrice, setMaxPrice] = React.useState<number | undefined>(undefined);
  const [sort, setSort] = React.useState<string>(() => {
    try { return localStorage.getItem(SORT_STORAGE_KEY) || 'price-asc'; } catch { return 'price-asc'; }
  });
  const countryOptions = React.useMemo(() => {
    const all = [{ value: 'ALL', label: '🌐 All Countries' }];
    const list = getAllCountries().map((c: Country) => ({ value: c.code, label: `${c.flag} ${c.label}` }));
    return [...all, ...list];
  }, []);
  const [selected, setSelected] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPARE_STORAGE_KEY) || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listPlans(country);
        if (mounted) setPlans(data as Plan[]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [country]);
  const insurers = React.useMemo(() => Array.from(new Set(plans.map(p => p.insurer))).sort(), [plans]);
  const coverages = React.useMemo(() => Array.from(new Set(plans.map(p => p.coverageLevel))).sort(), [plans]);
  const filtered = React.useMemo(() => {
    return plans.filter(p =>
      (insurer === 'all' || p.insurer === insurer) &&
      (coverage === 'all' || String(p.coverageLevel) === coverage) &&
      (typeof maxPrice !== 'number' || p.priceMonthly <= maxPrice)
    );
  }, [plans, insurer, coverage, maxPrice]);
  const parseWaiting = React.useCallback((s: string): number => {
    if (!s) return Number.MAX_SAFE_INTEGER;
    const n = parseFloat(String(s).match(/\d+(?:\.\d+)?/)?.[0] || '0');
    const lower = s.toLowerCase();
    if (lower.includes('day')) return n;
    if (lower.includes('week')) return n * 7;
    if (lower.includes('month')) return n * 30;
    return n;
  }, []);
  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case 'price-asc':
        arr.sort((a, b) => a.priceMonthly - b.priceMonthly); break;
      case 'price-desc':
        arr.sort((a, b) => b.priceMonthly - a.priceMonthly); break;
      case 'insurer-az':
        arr.sort((a, b) => a.insurer.localeCompare(b.insurer)); break;
      case 'coverage-az':
        arr.sort((a, b) => String(a.coverageLevel).localeCompare(String(b.coverageLevel))); break;
      case 'waiting-asc':
        arr.sort((a, b) => parseWaiting(a.waitingPeriod) - parseWaiting(b.waitingPeriod)); break;
      default: break;
    }
    return arr;
  }, [filtered, sort, parseWaiting]);
  const toggleCompare = (id: string, checked: boolean) => {
    const next = checked ? Array.from(new Set([...selected, id])) : selected.filter(x => x !== id);
    setSelected(next);
    try { localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next)); } catch {}
    try { window.dispatchEvent(new Event('compare:changed')); } catch {}
  };
  const clearCompare = () => {
    setSelected([]);
    try { localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify([])); } catch {}
    try { window.dispatchEvent(new Event('compare:changed')); } catch {}
  };
  return (
    <>
      <Alert type="info" showIcon message="Demo Mode" description="This page uses demo data. All features are fully functional for demonstration purposes." style={{ marginBottom: 16 }} />
      <Card style={{ marginBottom: 12 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <div style={{ color: '#64748b' }}>Country</div>
              <Select
                showSearch
                value={country}
                onChange={(v) => { setCountry(v); try { localStorage.setItem(COUNTRY_STORAGE_KEY, v); } catch {}; const next = new URLSearchParams(sp); next.set('country', v); setSp(next, { replace: true }); }}
                optionFilterProp="label"
                filterOption={(input, option) => String(option?.label || '').toLowerCase().includes(input.toLowerCase())}
                style={{ width: '100%' }}
                size="large"
                dropdownMatchSelectWidth
                options={countryOptions}
              />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <div style={{ color: '#64748b' }}>Insurer</div>
              <Select
                style={{ width: '100%' }}
                value={insurer}
                onChange={setInsurer}
                size="large"
                dropdownMatchSelectWidth
                options={[{ value: 'all', label: 'All' }, ...insurers.map(i => ({ value: i, label: i }))]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <div style={{ color: '#64748b' }}>Coverage</div>
              <Select
                style={{ width: '100%' }}
                value={coverage}
                onChange={setCoverage}
                size="large"
                dropdownMatchSelectWidth
                options={[{ value: 'all', label: 'All' }, ...coverages.map(c => ({ value: String(c), label: String(c) }))]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <div style={{ color: '#64748b' }}>Max Monthly Price (€)</div>
              <InputNumber min={0} style={{ width: '100%' }} size="large" value={maxPrice as any} onChange={(v) => setMaxPrice(typeof v === 'number' ? v : undefined)} placeholder="No limit" />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <div style={{ color: '#64748b' }}>Sort by</div>
              <Select
                style={{ width: '100%' }}
                size="large"
                value={sort}
                onChange={(v) => { setSort(v); try { localStorage.setItem(SORT_STORAGE_KEY, v); } catch {} }}
                options={[
                  { value: 'price-asc', label: 'Price: Low to High' },
                  { value: 'price-desc', label: 'Price: High to Low' },
                  { value: 'waiting-asc', label: 'Waiting: Shortest First' },
                  { value: 'insurer-az', label: 'Insurer: A–Z' },
                  { value: 'coverage-az', label: 'Coverage: A–Z' },
                ]}
              />
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={() => { setInsurer('all'); setCoverage('all'); setMaxPrice(undefined); }}>Clear filters</Button>
          <Button onClick={clearCompare}>Clear compare</Button>
        </div>
      </Card>
      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Col xs={24} md={12} lg={8} key={i}><Card><Skeleton active /></Card></Col>
          ))}
        </Row>
      ) : filtered.length === 0 ? (
        <Alert type="warning" showIcon message="No plans found" description={<span>No plans match the selected country and filters. Try changing the country or clearing filters.</span>} />
      ) : (
        <Row gutter={[16, 16]}>
          {sorted.map((p: Plan) => (
            <Col xs={24} md={12} lg={8} key={p.id}>
              <Card title={`${p.name}`} bordered hoverable>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Tag color="geekblue">{p.insurer}</Tag>
                  <Tag color="cyan">{p.coverageLevel}</Tag>
                  <Tag color="green">Waiting: {p.waitingPeriod}</Tag>
                  {p.country && <Tag color="blue">{toFlag(p.country)} {p.country}</Tag>}
                </div>
                <List size="small" dataSource={p.benefits} renderItem={(b: string) => <List.Item style={{ padding: '4px 0' }}>{b}</List.Item>} />
                <Divider />
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Statistic prefix="€" precision={2} value={p.priceMonthly} title="Monthly" />
                  <Space>
                    <Checkbox checked={selected.includes(p.id)} onChange={(e) => toggleCompare(p.id, e.target.checked)}>Add to compare</Checkbox>
                    <Button type="primary" onClick={() => { const next = new URLSearchParams(sp); next.set('tab', 'purchase'); next.set('purchasePlanId', p.id); setSp(next, { replace: true }); (window as any).scrollTo({ top: 0, behavior: 'smooth' }); }}>Select</Button>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {selected.length >= 2 && (
        <Alert
          type="success"
          showIcon
          message={`Ready to compare (${selected.length})`}
          description={<span>You have selected {selected.length} plans. Click Compare to review side-by-side.</span>}
          action={
            <Space>
              <Button onClick={clearCompare}>Clear</Button>
              <Button type="primary" onClick={goToCompare}>Compare</Button>
            </Space>
          }
          style={{ marginTop: 12 }}
        />
      )}
    </>
  );
};

const PremiumCalculatorTab: React.FC = () => {
  const [form] = Form.useForm();
  const [result, setResult] = React.useState<{ base: number; loading: number; total: number } | null>(null);
  const recalc = React.useCallback(async () => {
    const v = form.getFieldsValue();
    const r = await calculatePremium({ age: Number(v.age || 30), dependents: Number(v.dependents || 0), prevYears: Number(v.prevYears || 0) });
    setResult(r);
  }, [form]);
  React.useEffect(() => { recalc(); }, []);
  return (
    <Card title="Premium Calculator">
      <Form form={form} layout="vertical" onValuesChange={recalc} onFinish={recalc}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Age" name="age" initialValue={30}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Dependents" name="dependents" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Previous Insurance (years)" name="prevYears" initialValue={0}>
              <InputNumber min={0} max={50} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit">Calculate</Button>
      </Form>
      {result && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}><Statistic title="Base" prefix="€" value={result.base} precision={2} /></Col>
          <Col xs={24} md={8}><Statistic title="Loading" prefix="€" value={result.loading} precision={2} /></Col>
          <Col xs={24} md={8}><Statistic title="Total" prefix="€" value={result.total} precision={2} /></Col>
        </Row>
      )}
      {result && (
        <div style={{ marginTop: 8, color: '#64748b' }}>
          Estimated total = Base + Loading. Values recompute as you edit.
        </div>
      )}
    </Card>
  );
};

const CompareTab: React.FC = () => {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPARE_STORAGE_KEY) || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDiffOnly, setShowDiffOnly] = React.useState<boolean>(() => {
    try {
      const qp = searchParams.get('diff');
      if (qp !== null) return qp === '1' || qp === 'true';
      const stored = localStorage.getItem('compareShowDiff');
      if (stored === '1') return true;
      if (stored === '0') return false;
    } catch {}
    return true; // default to showing differences
  });
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!selected.length) { setRows([]); return; }
        const data = await comparePlans({ planIds: selected });
        if (mounted) setRows(data as any[]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [selected]);
  // Listen for selection changes triggered from other tabs (PlansTab)
  React.useEffect(() => {
    const onChanged = () => {
      try {
        const raw = localStorage.getItem(COMPARE_STORAGE_KEY) || '[]';
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSelected(arr);
      } catch {}
    };
    window.addEventListener('compare:changed', onChanged);
    return () => window.removeEventListener('compare:changed', onChanged);
  }, []);
  const columns = [
    { title: 'Plan', dataIndex: 'name' },
    { title: 'Insurer', dataIndex: 'insurer' },
    { title: 'Coverage', dataIndex: 'coverageLevel' },
    { title: 'Waiting', dataIndex: 'waitingPeriod' },
    { title: 'Price (€)', dataIndex: 'priceMonthly' },
    { title: 'Δ Price', dataIndex: 'delta' },
    { title: 'Actions', dataIndex: 'actions' },
  ];
  const diffKeys = React.useMemo(() => {
    if (rows.length <= 1) return new Set<string>();
    const keys = ['insurer','coverageLevel','waitingPeriod','priceMonthly'];
    const s = new Set<string>();
    for (const key of keys) {
      const set = new Set(rows.map((r: any) => String(r[key])));
      if (set.size > 1) s.add(key);
    }
    return s;
  }, [rows]);
  const decoratedColumns = React.useMemo(() => {
    const highlightStyle: React.CSSProperties = { background: '#ecfeff', borderRadius: 6, padding: '2px 6px' };
    const cheapest = rows.length ? Math.min(...rows.map((r: any) => Number(r.priceMonthly || 0))) : 0;
    const removeFromCompare = (id: string) => {
      try {
        const raw = localStorage.getItem(COMPARE_STORAGE_KEY) || '[]';
        const arr = JSON.parse(raw);
        const next = Array.isArray(arr) ? arr.filter((x: string) => x !== id) : [];
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
        setSelected(next);
        window.dispatchEvent(new Event('compare:changed'));
      } catch {}
    };
    return columns.map((c: any) => {
      if (c.dataIndex === 'name') return c;
      if (c.dataIndex === 'delta') {
        return {
          ...c,
          render: (_: any, record: any) => {
            const price = Number(record.priceMonthly || 0);
            const diff = Math.max(0, Math.round((price - cheapest) * 100) / 100);
            if (!rows.length) return '-';
            if (diff === 0) return <Tag color="green">Cheapest</Tag>;
            return <span style={highlightStyle}>+€{diff.toFixed(2)}</span>;
          }
        }
      }
      if (c.dataIndex === 'actions') {
        return {
          ...c,
          render: (_: any, record: any) => (
            <Button size="small" onClick={() => removeFromCompare(record.id)}>Remove</Button>
          )
        }
      }
      if (!diffKeys.has(String(c.dataIndex))) return c;
      return { ...c, render: (val: any) => <span style={highlightStyle}>{String(val)}</span> };
    });
  }, [columns, diffKeys, rows]);
  const visibleColumns = React.useMemo(() => {
    if (!showDiffOnly || rows.length <= 1) return decoratedColumns;
    const keys = ['insurer','coverageLevel','waitingPeriod','priceMonthly'];
    const differing = new Set<string>();
    for (const key of keys) {
      const set = new Set(rows.map((r: any) => String(r[key])));
      if (set.size > 1) differing.add(key);
    }
    return decoratedColumns.filter((c: any) => c.dataIndex === 'name' || c.dataIndex === 'delta' || c.dataIndex === 'actions' || differing.has(String(c.dataIndex)));
  }, [showDiffOnly, rows, decoratedColumns]);

  // Benefits Matrix: build union of all benefits across compared plans
  const benefitUniverse = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const list = Array.isArray(r.benefits) ? r.benefits : [];
      for (const b of list) set.add(String(b));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const benefitColumns = React.useMemo(() => {
    const cols: any[] = [
      { title: 'Benefit', dataIndex: 'benefit' },
    ];
    for (const r of rows) {
      cols.push({
        title: r.name,
        dataIndex: r.id,
        align: 'center' as const,
        render: (v: boolean) => v ? <CheckOutlined style={{ color: '#10b981' }} /> : <CloseOutlined style={{ color: '#94a3b8' }} />,
      });
    }
    return cols;
  }, [rows]);
  const benefitData = React.useMemo(() => {
    const items = benefitUniverse.map(benefit => {
      const row: any = { key: benefit, benefit };
      for (const r of rows) {
        const has = Array.isArray(r.benefits) ? r.benefits.includes(benefit) : false;
        row[r.id] = !!has;
      }
      return row;
    });
    if (!showDiffOnly || rows.length <= 1) return items;
    // Filter out identical rows (either all true or all false across plans)
    return items.filter(rec => {
      const vals = rows.map(r => !!rec[r.id]);
      const uniq = new Set(vals.map(v => (v ? '1' : '0')));
      return uniq.size > 1; // keep only differing benefit rows
    });
  }, [benefitUniverse, rows, showDiffOnly]);
  const exportRef = React.useRef<HTMLDivElement>(null);
  const benefitExportRef = React.useRef<HTMLDivElement>(null);
  const hdrCountry = React.useMemo(() => {
    try { return localStorage.getItem(COUNTRY_STORAGE_KEY) || 'ALL'; } catch { return 'ALL'; }
  }, [rows, showDiffOnly]);
  const hdrNow = React.useMemo(() => new Date().toLocaleString(), [rows, showDiffOnly]);
  const doExportPng = async () => {
    if (!exportRef.current) return;
    const dataUrl = await htmlToImage.toPng(exportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'compare.png';
    a.click();
  };
  const doExportPdf = async () => {
    if (!exportRef.current) return;
    const dataUrl = await htmlToImage.toPng(exportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const img = new Image();
    img.src = dataUrl;
    await new Promise(r => { img.onload = r; });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 32;
    const headerH = 36;
    const footerH = 24;
    const contentW = pageWidth - margin * 2;
    const scale = contentW / img.width;
    const imgW = img.width * scale;
    const imgH = img.height * scale;
    const contentH = pageHeight - headerH - footerH - margin * 2;

    const drawHeaderFooter = (pageIndex: number, totalPages: number) => {
      // Vector logo: teal rounded square + white cross
      const lx = margin, ly = margin + 4; // logo top-left
      const ls = 20; // logo size
      // Teal square
      pdf.setFillColor(19, 194, 194);
      // roundedRect(x, y, w, h, rx, ry, style)
      // @ts-ignore roundedRect exists in jsPDF
      pdf.roundedRect(lx, ly, ls, ls, 4, 4, 'F');
      // White cross bars
      pdf.setFillColor(255, 255, 255);
      // vertical bar
      // @ts-ignore roundedRect exists in jsPDF
      pdf.roundedRect(lx + ls / 2 - 2, ly + 2, 4, ls - 4, 2, 2, 'F');
      // horizontal bar
      // @ts-ignore roundedRect exists in jsPDF
      pdf.roundedRect(lx + 2, ly + ls / 2 - 2, ls - 4, 4, 2, 2, 'F');

      // Title text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Ayphen Hospitals — Insurance Compare', margin + ls + 8, margin + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`${hdrNow} • Country: ${hdrCountry} • ${showDiffOnly ? 'Differences only' : 'All columns'}`, margin + ls + 8, margin + 28);
      // Footer
      pdf.setFontSize(9);
      pdf.text(`Generated by Insurance Compare • Page ${pageIndex} / ${totalPages}`, margin, pageHeight - margin);
    };

    const totalPages = Math.max(1, Math.ceil(imgH / contentH));
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage('a4', 'landscape');
      drawHeaderFooter(i + 1, totalPages);
      const yOffset = -i * contentH; // shift image up to reveal next slice
      const x = margin;
      const y = margin + headerH + yOffset;
      pdf.addImage(dataUrl, 'PNG', x, y, imgW, imgH);
    }
    pdf.save('compare.pdf');
  };
  const doExportBenefitsPng = async () => {
    if (!benefitExportRef.current) return;
    const dataUrl = await htmlToImage.toPng(benefitExportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'compare-benefits.png';
    a.click();
  };
  const doExportBenefitsPdf = async () => {
    if (!benefitExportRef.current) return;
    const dataUrl = await htmlToImage.toPng(benefitExportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const img = new Image();
    img.src = dataUrl;
    await new Promise(r => { img.onload = r; });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 32;
    const headerH = 32;
    const footerH = 20;
    const contentW = pageWidth - margin * 2;
    const scale = contentW / img.width;
    const imgW = img.width * scale;
    const imgH = img.height * scale;
    const contentH = pageHeight - headerH - footerH - margin * 2;

    const drawHeaderFooter = (pageIndex: number, totalPages: number) => {
      // Vector logo
      const lx = margin, ly = margin + 4; const ls = 20;
      pdf.setFillColor(19, 194, 194);
      // @ts-ignore
      pdf.roundedRect(lx, ly, ls, ls, 4, 4, 'F');
      pdf.setFillColor(255, 255, 255);
      // @ts-ignore
      pdf.roundedRect(lx + ls / 2 - 2, ly + 2, 4, ls - 4, 2, 2, 'F');
      // @ts-ignore
      pdf.roundedRect(lx + 2, ly + ls / 2 - 2, ls - 4, 4, 2, 2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Ayphen Hospitals — Benefits Matrix', margin + ls + 8, margin + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`${hdrNow} • Country: ${hdrCountry}`, margin + ls + 8, margin + 28);
      pdf.setFontSize(9);
      pdf.text(`Generated by Insurance Compare • Page ${pageIndex} / ${totalPages}`, margin, pageHeight - margin);
    };

    const totalPages = Math.max(1, Math.ceil(imgH / contentH));
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage('a4', 'landscape');
      drawHeaderFooter(i + 1, totalPages);
      const yOffset = -i * contentH;
      const x = margin;
      const y = margin + headerH + yOffset;
      pdf.addImage(dataUrl, 'PNG', x, y, imgW, imgH);
    }
    pdf.save('compare-benefits.pdf');
  };
  return (
    <Card
      title="Compare Plans"
      extra={
        <Space>
          <Checkbox
            checked={showDiffOnly}
            onChange={(e) => { const v = e.target.checked; setShowDiffOnly(v); try { localStorage.setItem('compareShowDiff', v ? '1' : '0'); } catch {}; const next = new URLSearchParams(searchParams); next.set('diff', v ? '1' : '0'); setSearchParams(next, { replace: true }); }}
          >
            Show only differences
          </Checkbox>
          <Button onClick={doExportPng}>Export PNG</Button>
          <Button onClick={doExportPdf}>Export PDF</Button>
          <Button onClick={() => { localStorage.setItem(COMPARE_STORAGE_KEY, '[]'); setSelected([]); try { window.dispatchEvent(new Event('compare:changed')); } catch {} }}>Clear selection</Button>
        </Space>
      }
    >
      <div ref={exportRef}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Compare Plans — {hdrCountry}</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>{hdrNow} · {showDiffOnly ? 'Differences only' : 'All columns'} · {rows.length} plan(s)</div>
        </div>
        {!selected.length && <Alert type="info" showIcon message="No plans selected" description="Select at least two plans in the Plans tab to compare." style={{ marginBottom: 12 }} />}
        {loading ? <Skeleton active /> : <Table columns={visibleColumns as any} dataSource={rows} rowKey="id" pagination={false} />}
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>Teal highlight shows values that differ across selected plans.</div>
        {showDiffOnly && rows.length > 1 && visibleColumns.length === (rows.length ? 3 : 0) && (
          <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}>No identical columns to hide for this selection.</div>
        )}
        {!loading && rows.length > 0 && (
          <>
            <Divider orientation="left" style={{ marginTop: 16 }}>Benefits Matrix</Divider>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
              <Button size="small" onClick={doExportBenefitsPng}>Export Benefits PNG</Button>
              <Button size="small" onClick={doExportBenefitsPdf}>Export Benefits PDF</Button>
            </div>
            {benefitUniverse.length === 0 ? (
              <Alert type="info" showIcon message="No benefits available to compare" style={{ marginBottom: 12 }} />
            ) : (
              <div ref={benefitExportRef}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Benefits Matrix — {hdrCountry}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{hdrNow} · {rows.length} plan(s)</div>
                </div>
                <Table
                  columns={benefitColumns as any}
                  dataSource={benefitData}
                  rowKey="key"
                  pagination={false}
                />
              </div>
            )}
            {showDiffOnly && benefitUniverse.length > 0 && benefitData.length === benefitUniverse.length && (
              <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}>All listed benefits differ across selected plans.</div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

const FamilyEnrollmentTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const onFinish = async (v: any) => {
    setLoading(true);
    try {
      const body = {
        primaryAge: Number(v.primaryAge || 30),
        spouseAge: v.spouseAge ? Number(v.spouseAge) : undefined,
        children: Number(v.children || 0),
        insurerPreference: v.insurerPreference === 'any' ? undefined : String(v.insurerPreference),
        priority: String(v.priority || 'cheapest'),
      } as any;
      let country = 'ALL';
      try { country = localStorage.getItem(COUNTRY_STORAGE_KEY) || 'ALL'; } catch {}
      const res = await familyCalc(body, country);
      setPlans(res || []);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card title="Family Enrollment">
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ primaryAge: 30, spouseAge: undefined, children: 0, insurerPreference: 'any', priority: 'cheapest' }}>
        <Row gutter={16}>
          <Col xs={24} md={8}><Form.Item label="Primary Age" name="primaryAge" rules={[{ required: true, message: 'Primary age is required' }]}><InputNumber min={18} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label="Spouse Age (optional)" name="spouseAge"><InputNumber min={18} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label="Children Count" name="children"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item label="Preferred Insurer" name="insurerPreference"><Select options={[{ value: 'any', label: 'Any' }, { value: 'Vhi', label: 'Vhi' }, { value: 'Laya', label: 'Laya' }, { value: 'Irish Life', label: 'Irish Life' }]} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="Priority" name="priority"><Select options={[{ value: 'cheapest', label: 'Cheapest' }, { value: 'coverage', label: 'Best Coverage' }, { value: 'waiting', label: 'Shortest Waiting' }]} /></Form.Item></Col>
        </Row>
        <Space>
          <Button type="default" onClick={() => { form.resetFields(); setPlans([]); }}>Reset</Button>
          <Button type="primary" htmlType="submit" loading={loading}>Preview Packages</Button>
        </Space>
      </Form>
      <Divider orientation="left" style={{ marginTop: 16 }}>Recommended Packages</Divider>
      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Col xs={24} md={12} lg={8} key={i}><Card><Skeleton active /></Card></Col>
          ))}
        </Row>
      ) : plans.length === 0 ? (
        <Alert type="info" showIcon message="No recommendations yet" description="Fill the form and click Preview Packages to see recommendations." />
      ) : (
        <Row gutter={[16, 16]}>
          {plans.map((p: Plan) => (
            <Col xs={24} md={12} lg={8} key={p.id}>
              <Card title={p.name} bordered hoverable>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Tag color="geekblue">{p.insurer}</Tag>
                  <Tag color="cyan">{p.coverageLevel}</Tag>
                  <Tag color="green">Waiting: {p.waitingPeriod}</Tag>
                  {p.country && <Tag color="blue">{toFlag(p.country)} {p.country}</Tag>}
                </div>
                <List size="small" dataSource={p.benefits} renderItem={(b: string) => <List.Item style={{ padding: '4px 0' }}>{b}</List.Item>} />
                <Divider />
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Statistic prefix="€" precision={2} value={p.priceMonthly} title="Monthly" />
                  <Space>
                    <Button onClick={() => { try { const raw = localStorage.getItem(COMPARE_STORAGE_KEY) || '[]'; const arr = JSON.parse(raw); const next = Array.isArray(arr) ? Array.from(new Set([...arr, p.id])) : [p.id]; localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next)); window.dispatchEvent(new Event('compare:changed')); (window as any).__message?.success?.('Added to compare'); } catch {} }}>Add to compare</Button>
                    <Button type="primary" onClick={() => { const next = new URLSearchParams(window.location.search); next.set('tab', 'purchase'); next.set('purchasePlanId', p.id); window.history.replaceState(null, '', `${window.location.pathname}?${next.toString()}`); (window as any).scrollTo({ top: 0, behavior: 'smooth' }); }}>Select</Button>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
};

const PurchaseTab: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listPlans();
        if (mounted) setPlans(data as Plan[]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  // Preselect plan from URL param when plans are loaded
  React.useEffect(() => {
    if (!plans.length) return;
    const pid = searchParams.get('purchasePlanId');
    if (pid && plans.some(p => p.id === pid)) {
      try { form.setFieldsValue({ planId: pid }); } catch {}
    }
  }, [plans, searchParams]);
  return (
    <Card title="Purchase (Demo)">
      <Alert type="warning" showIcon message="Demo purchase only" description="No real payments are processed. This calls a placeholder backend when enabled." style={{ marginBottom: 16 }} />
      {!user && (
        <Alert type="info" showIcon message="Login required" description={
          <span>
            Please <a href="/login">login</a> or <a href="/register">register</a> to purchase a plan.
          </span>
        } style={{ marginBottom: 16 }} />
      )}
      <Form form={form} layout="vertical" onFinish={async (v) => {
        if (!user) {
          try { (window as any).__message?.info?.('Please login to continue'); } catch {}
          return;
        }
        if (!v.planId) {
          try { (window as any).__message?.warning?.('Please select a plan'); } catch {}
          return;
        }
        setSubmitting(true);
        try {
          await purchasePlan({ planId: String(v.planId), billingCycle: String(v.billingCycle || 'monthly') as any });
          try { (window as any).__message?.success?.('Policy purchased successfully'); } catch {}
        } catch (_e) {
          try { (window as any).__message?.error?.('Failed to purchase plan'); } catch {}
        } finally {
          setSubmitting(false);
        }
      }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Select Plan">
              {loading ? (
                <Skeleton active paragraph={false} title={{ width: '60%' }} />
              ) : (
                <Form.Item name="planId" noStyle>
                  <Select placeholder="Choose a plan" options={plans.map((p: Plan) => ({ value: p.id, label: `${p.name} — €${p.priceMonthly}/mo` }))} />
                </Form.Item>
              )}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Billing Cycle" name="billingCycle" initialValue="monthly">
              <Select options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual (save 8%)' }]} />
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left">Payment Details (Dummy)</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item label="Card Number"><InputNumber style={{ width: '100%' }} placeholder={"4111 1111 1111 1111"} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item label="Expiry (MM/YY)"><InputNumber style={{ width: '100%' }} placeholder={"12/26"} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item label="CVV"><InputNumber style={{ width: '100%' }} placeholder={"123"} /></Form.Item></Col>
        </Row>
        <Button type="primary" htmlType="submit" disabled={!user} loading={submitting}>Confirm Purchase</Button>
      </Form>
    </Card>
  );
};

const ClaimsTab: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await listClaims();
        if (mounted) setItems(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const columns = [
    { title: 'ID', dataIndex: 'id' },
    { title: 'Date', dataIndex: 'date' },
    { title: 'Type', dataIndex: 'type' },
    { title: 'Amount (€)', dataIndex: 'amount' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'Approved' ? 'green' : s === 'Rejected' ? 'red' : 'gold'}>{s}</Tag> },
  ];
  return (
    <Card title="Claims">
      {!user && (
        <Alert type="info" showIcon message="Login required" description={<span>Please <a href="/login">login</a> or <a href="/register">register</a> to view your claims.</span>} style={{ marginBottom: 16 }} />
      )}
      {user && <Button style={{ marginBottom: 12 }}>Upload Receipt (Demo)</Button>}
      {user ? (loading ? <Skeleton active /> : <Table columns={columns as any} dataSource={items} rowKey="id" pagination={false} />) : null}
    </Card>
  );
};

const DashboardTab: React.FC = () => {
  const { user } = useAuth();
  const [benefits, setBenefits] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const d = await dashboard();
        if (mounted) setBenefits(d.benefits || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <Card title="Benefits & Usage">
      {!user && (
        <Alert type="info" showIcon message="Login required" description={<span>Please <a href="/login">login</a> or <a href="/register">register</a> to view your insurance dashboard.</span>} style={{ marginBottom: 16 }} />
      )}
      {user ? (loading ? <Skeleton active /> : (
        <Row gutter={[16, 16]}>
          {benefits.map((b: any) => (
            <Col xs={24} md={8} key={b.key}>
              <Card>
                <Statistic title={b.label} value={`${b.used}/${b.total}`} />
              </Card>
            </Col>
          ))}
        </Row>
      )) : null}
    </Card>
  );
};

const Insurance: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get('tab') || 'plans';
  const [activeKey, setActiveKey] = React.useState<string>(initial);
  const setTab = (key: string) => {
    setActiveKey(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };
  // Keep active tab in sync when URL changes externally
  React.useEffect(() => {
    const k = searchParams.get('tab') || 'plans';
    if (k !== activeKey) setActiveKey(k);
  }, [searchParams]);
  return (
    <>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Health Insurance</h1>
        <Tag color={INSURANCE_USE_MOCK ? 'gold' : 'green'}>{INSURANCE_USE_MOCK ? 'Mock' : 'Live'}</Tag>
      </div>
      <div style={{ color: '#64748b', marginTop: -8, marginBottom: 8 }}>Compare plans, calculate premiums, and manage benefits.</div>
      <Tabs
        activeKey={activeKey}
        onChange={(k) => setTab(k)}
        items={[
          { key: 'plans', label: 'Plans', children: <PlansTab goToCompare={() => setTab('compare')} /> },
          { key: 'calc', label: 'Premium Calculator', children: <PremiumCalculatorTab /> },
          { key: 'compare', label: 'Compare', children: <CompareTab /> },
          { key: 'family', label: 'Family Enrollment', children: <FamilyEnrollmentTab /> },
          { key: 'purchase', label: 'Purchase', children: <PurchaseTab /> },
          { key: 'claims', label: 'Claims', children: <ClaimsTab /> },
          { key: 'dashboard', label: 'Dashboard', children: <DashboardTab /> },
        ]}
      />
    </>
  );
};

export default Insurance;
