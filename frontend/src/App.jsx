import { useEffect, useState } from 'react';
import { api } from './api';
import './App.css';

const PROVINCES = [
  'Gauteng',
  'Free State',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
];

const ALLOWED_FRUITS = ['Apples', 'Bananas', 'Oranges', 'Mangoes', 'Grapes'];
const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
const PAYMENT_METHODS = ['CASH', 'MOBILE_MONEY', 'CREDIT'];

const fruitAvailabilityLabel = (status) => (status === 'ACTIVE' ? 'Available' : 'Unavailable');

const fmtMoney = (val) => `M ${Number(val || 0).toFixed(2)}`;
const fmtDate = (val) => (val ? String(val).slice(0, 10) : '-');

function GoogleMapBox({ query, title, subtitle }) {
  const cleanQuery = (query || 'Maseru, Lesotho').trim();
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(cleanQuery)}&output=embed`;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;

  return (
    <div className="card">
      <div className="card-header-row">
        <div>
          <h2>{title || `Location Map: ${cleanQuery}`}</h2>
          {subtitle && <div className="kpi-sub">{subtitle}</div>}
        </div>
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none' }}
        >
          Open in Google Maps ↗
        </a>
      </div>
      <iframe
        title={cleanQuery}
        className="map-frame"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
      />
    </div>
  );
}

const FRUIT_ART = {
  apples: { emoji: '🍎', tone: 'apple' },
  bananas: { emoji: '🍌', tone: 'banana' },
  oranges: { emoji: '🍊', tone: 'orange' },
  mangoes: { emoji: '🥭', tone: 'mango' },
  grapes: { emoji: '🍇', tone: 'grape' },
};

function FruitArtwork({ name }) {
  const fruitName = String(name || 'Fresh produce').trim();
  const art = FRUIT_ART[fruitName.toLowerCase()] || { emoji: '🧺', tone: 'produce' };

  return (
    <div className={`fruit-art fruit-art-${art.tone}`} role="img" aria-label={`${fruitName} illustration`}>
      <span className="fruit-art-orbit" />
      <span className="fruit-art-emoji" aria-hidden="true">
        {art.emoji}
      </span>
      <span className="fruit-art-spark fruit-art-spark-one" />
      <span className="fruit-art-spark fruit-art-spark-two" />
    </div>
  );
}

function FruitGallery({ fruits, stock }) {
  const galleryFruits = fruits.length
    ? fruits
    : ALLOWED_FRUITS.map((fruit_name) => ({ fruit_name, status: 'ACTIVE' }));

  return (
    <section className="produce-showcase" aria-label="Fresh fruit collection">
      <div className="showcase-heading">
        <div>
          <span className="eyebrow">Fresh from the orchard</span>
          <h2>Today’s produce</h2>
        </div>
        <span className="showcase-note">A bright look at your fruit collection</span>
      </div>
      <div className="fruit-gallery">
        {galleryFruits.map((fruit) => {
          const fruitStock = stock.filter(
            (item) =>
              item.fruit_name === fruit.fruit_name ||
              (item.fruit_id != null && item.fruit_id === fruit.fruit_id)
          );
          const available = fruitStock.reduce(
            (sum, item) => sum + Number(item.available_quantity || 0),
            0
          );

          return (
            <article className="fruit-card" key={fruit.fruit_id || fruit.fruit_name}>
              <FruitArtwork name={fruit.fruit_name} />
              <div className="fruit-card-copy">
                <h3>{fruit.fruit_name}</h3>
                <span className="fruit-card-meta">
                  {fruit.status !== 'ACTIVE'
                    ? fruitAvailabilityLabel(fruit.status)
                    : fruitStock.length
                    ? `${fruitAvailabilityLabel(fruit.status)} · ${available} units in stock`
                    : `${fruitAvailabilityLabel(fruit.status)} · Fresh produce`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(null);
  const [banner, setBanner] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [sellingPrices, setSellingPrices] = useState(null);

  const [topFruits, setTopFruits] = useState([]);
  const [topVendor, setTopVendor] = useState(null);
  const [stockReport, setStockReport] = useState([]);
  const [revRange, setRevRange] = useState({ start: '2026-01-01', end: '2026-12-31' });
  const [revenueData, setRevenueData] = useState(null);

  const notify = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 5000);
  };

  const loadAll = async () => {
    try {
      await api.health();
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }

    try {
      const [
        supData,
        fruitData,
        stockData,
        lowData,
        vendorData,
        purchData,
        salesData,
        priceData,
      ] =
        await Promise.all([
          api.getSuppliers(),
          api.getFruits(),
          api.getStock(),
          api.getLowStock(15),
          api.getVendors(),
          api.getPurchases(),
          api.getSales(),
          api.getSellingPrices(),
        ]);
      setSuppliers(supData);
      setFruits(fruitData);
      setStock(stockData);
      setLowStock(lowData.items || []);
      setVendors(vendorData);
      setPurchases(purchData);
      setSales(salesData);
      setSellingPrices(priceData);
    } catch (err) {
      notify('error', `Failed to load data: ${err.message}`);
    }
  };

  const loadReports = async () => {
    try {
      const [tf, hv, sr, rev] = await Promise.all([
        api.getTopFruits(),
        api.getHighestVolumeVendor(),
        api.getStockReport(),
        api.getRevenue(revRange.start, revRange.end),
      ]);
      setTopFruits(Array.isArray(tf) ? tf : []);
      setTopVendor(hv);
      setStockReport(Array.isArray(sr) ? sr : []);
      setRevenueData(rev);
    } catch (err) {
      notify('error', `Reports error: ${err.message}`);
    }
  };

  useEffect(() => {
    loadAll();
    loadReports();
  }, []);

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  const totalCollected = sales.reduce((acc, s) => acc + Number(s.amount_paid || 0), 0);
  const totalReceivables = totalRevenue - totalCollected;
  const totalPurchaseSpend = purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);

  const pageMeta = {
    dashboard: {
      title: 'Batloung Farm Distribution Command Center',
      desc: 'Live stock movement, vendor credit balances, and regional distribution overview.',
    },
    stock: {
      title: 'Fruit Catalog & Live Stock',
      desc: 'Manage active fruit lines and monitor SMALL, MEDIUM, and LARGE packaging quantities.',
    },
    purchases: {
      title: 'Supplier Purchases (Stock In)',
      desc: 'Record incoming produce batches from South African suppliers and increment stock.',
    },
    sales: {
      title: 'Vendor Sales & Credit Ledger',
      desc: 'Dispatch fruit orders to local vendors, track payments, and update stock automatically.',
    },
    vendors: {
      title: 'Local Vendors & Google Maps',
      desc: 'View vendor credit balances and inspect delivery districts on Google Maps.',
    },
    suppliers: {
      title: 'South African Suppliers & Google Maps',
      desc: 'Manage supplier contracts across provinces and locate farms/hubs on Google Maps.',
    },
    reports: {
      title: 'Analytics Reports & Foreign Keys',
      desc: 'Review revenue, top fruits, highest-volume vendors, and relational foreign keys.',
    },
  }[tab];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand">Batloung Farm</div>
          <div className="brand-sub">Distribution & Stock System</div>
        </div>
        {[
          ['dashboard', 'Dashboard Overview'],
          ['stock', 'Fruits & Live Stock'],
          ['purchases', 'Purchases (Stock In)'],
          ['sales', 'Sales (Distribution)'],
          ['vendors', 'Vendors & Map'],
          ['suppliers', 'Suppliers & Map'],
          ['reports', 'Reports & Foreign Keys'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`nav-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </aside>

      <main className="main">
        <div className="hero-banner">
          <div>
            <span className="hero-kicker">BATLOUNG FARM · FRESHNESS IN MOTION</span>
            <h1>{pageMeta.title}</h1>
            <p>{pageMeta.desc}</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="hero-art-sun" />
            <span className="hero-art-fruit hero-art-apple">🍎</span>
            <span className="hero-art-fruit hero-art-orange">🍊</span>
            <span className="hero-art-fruit hero-art-banana">🍌</span>
            <span className="hero-art-leaf">✦</span>
          </div>
          <span className={`status-pill ${apiOnline ? '' : 'offline'}`}>
            {apiOnline === null
              ? 'Checking API...'
              : apiOnline
              ? 'API & MySQL Connected'
              : 'Backend Offline (Start server.js on port 5000)'}
          </span>
        </div>

        {banner && (
          <div className={`alert ${banner.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {banner.text}
          </div>
        )}

        {tab === 'dashboard' && (
          <>
            <FruitGallery fruits={fruits} stock={stock} />

            <div className="grid-4">
              <div className="kpi-card">
                <div className="kpi-label">Total Sales Value</div>
                <div className="kpi-value">{fmtMoney(totalRevenue)}</div>
                <div className="kpi-sub">{sales.length} recorded orders</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Cash / Mobile Collected</div>
                <div className="kpi-value">{fmtMoney(totalCollected)}</div>
                <div className="kpi-sub">Settled funds</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Vendor Credit Owed</div>
                <div className="kpi-value">{fmtMoney(totalReceivables)}</div>
                <div className="kpi-sub">Outstanding vendor balances</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Total Stock Purchases</div>
                <div className="kpi-value">{fmtMoney(totalPurchaseSpend)}</div>
                <div className="kpi-sub">{purchases.length} supplier deliveries</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header-row">
                  <h2>Low Stock Alerts (15 units or fewer)</h2>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fruit (FK)</th>
                        <th>Package</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.length === 0 ? (
                        <tr>
                          <td colSpan="3">All stock levels are healthy.</td>
                        </tr>
                      ) : (
                        lowStock.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              {item.fruit_name}{' '}
                              <span className="fk-tag">fruit_id: {item.fruit_id}</span>
                            </td>
                            <td>{item.packaging_size}</td>
                            <td>
                              <span className="badge badge-low">{item.available_quantity}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header-row">
                  <h2>Recent Vendor Sales</h2>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Vendor (FK)</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 6).map((s) => (
                        <tr key={s.sale_id}>
                          <td>
                            {s.vendor_name}{' '}
                            <span className="fk-tag">vendor_id: {s.vendor_id}</span>
                          </td>
                          <td>{fmtDate(s.sale_date)}</td>
                          <td>{fmtMoney(s.total_amount)}</td>
                          <td>
                            <span
                              className={`badge ${
                                s.payment_status === 'PAID'
                                  ? 'badge-paid'
                                  : s.payment_status === 'PARTIALLY_PAID'
                                  ? 'badge-partial'
                                  : 'badge-unpaid'
                              }`}
                            >
                              {s.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'stock' && (
          <>
            <FruitGallery fruits={fruits} stock={stock} />
            <FruitsAndStockTab fruits={fruits} stock={stock} onRefresh={loadAll} notify={notify} />
          </>
        )}

        {tab === 'purchases' && (
          <PurchasesTab
            suppliers={suppliers}
            fruits={fruits}
            purchases={purchases}
            onRefresh={() => {
              loadAll();
              loadReports();
            }}
            notify={notify}
          />
        )}

        {tab === 'sales' && (
          <SalesTab
            vendors={vendors}
            fruits={fruits}
            stock={stock}
            sales={sales}
            sellingPrices={sellingPrices}
            onRefresh={() => {
              loadAll();
              loadReports();
            }}
            notify={notify}
          />
        )}

        {tab === 'vendors' && (
          <VendorsTab vendors={vendors} onRefresh={loadAll} notify={notify} />
        )}

        {tab === 'suppliers' && (
          <SuppliersTab suppliers={suppliers} onRefresh={loadAll} notify={notify} />
        )}

        {tab === 'reports' && (
          <ReportsTab
            topFruits={topFruits}
            topVendor={topVendor}
            stockReport={stockReport}
            revRange={revRange}
            setRevRange={setRevRange}
            revenueData={revenueData}
            onRunRevenue={loadReports}
          />
        )}
      </main>
    </div>
  );
}

/* -------------------- FRUITS & STOCK TAB -------------------- */
function FruitsAndStockTab({ fruits, stock, onRefresh, notify }) {
  const [form, setForm] = useState({ fruit_name: 'Apples', description: '', status: 'ACTIVE' });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateFruit(editingId, form);
        notify('success', 'Fruit updated');
      } else {
        await api.createFruit(form);
        notify('success', 'Fruit added with opening stock buckets');
      }
      setEditingId(null);
      setForm({ fruit_name: 'Apples', description: '', status: 'ACTIVE' });
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteFruit(id);
      notify('success', 'Fruit deleted');
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-row">
          <h2>{editingId ? `Edit Fruit #${editingId}` : 'Register / Configure Fruit'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Fruit Name
              <select
                value={form.fruit_name}
                onChange={(e) => setForm({ ...form, fruit_name: e.target.value })}
              >
                {ALLOWED_FRUITS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Description
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Fresh red apples"
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Available</option>
                <option value="INACTIVE">Unavailable</option>
              </select>
            </label>
          </div>
          <div className="row-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Update Fruit' : 'Add Fruit'}
            </button>
            {editingId && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ fruit_name: 'Apples', description: '', status: 'ACTIVE' });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header-row">
            <h2>Fruit Catalog (PK: fruit_id)</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fruit</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fruits.map((f) => (
                  <tr key={f.fruit_id}>
                    <td>{f.fruit_id}</td>
                    <td>{f.fruit_name}</td>
                    <td>{f.description}</td>
                    <td>
                      <span
                        className={`badge ${
                          f.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'
                        }`}
                      >
                        {fruitAvailabilityLabel(f.status)}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditingId(f.fruit_id);
                          setForm({
                            fruit_name: f.fruit_name,
                            description: f.description || '',
                            status: f.status,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(f.fruit_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <h2>Live Warehouse Stock (FK: fruit_id)</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fruit (FK)</th>
                  <th>Package Size</th>
                  <th>Available Units</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => (
                  <tr key={s.stock_id}>
                    <td>
                      {s.fruit_name} <span className="fk-tag">FK #{s.fruit_id}</span>
                    </td>
                    <td>{s.packaging_size}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.available_quantity <= 15 ? 'badge-low' : 'badge-active'
                        }`}
                      >
                        {s.available_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------- PURCHASES TAB -------------------- */
function PurchasesTab({ suppliers, fruits, purchases, onRefresh, notify }) {
  const activeFruits = fruits.filter((f) => f.status === 'ACTIVE');
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([
    { fruit_id: '', packaging_size: 'SMALL', quantity: 10, unit_cost: 15 },
  ]);

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const addLine = () =>
    setItems([
      ...items,
      {
        fruit_id: activeFruits[0]?.fruit_id || '',
        packaging_size: 'SMALL',
        quantity: 10,
        unit_cost: 15,
      },
    ]);

  const removeLine = (idx) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const totalCost = items.reduce(
    (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_cost || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplier_id: Number(supplierId || suppliers[0]?.supplier_id),
        purchase_date: purchaseDate,
        items: items.map((it) => ({
          fruit_id: Number(it.fruit_id || activeFruits[0]?.fruit_id),
          packaging_size: it.packaging_size,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
        })),
      };
      const res = await api.createPurchase(payload);
      notify('success', `${res.message} (Total: ${fmtMoney(res.total_amount)})`);
      setItems([{ fruit_id: '', packaging_size: 'SMALL', quantity: 10, unit_cost: 15 }]);
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-row">
          <h2>Record New Supplier Purchase (Increases Stock)</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Supplier (FK: supplier_id)
              <select
                value={supplierId || suppliers[0]?.supplier_id || ''}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.business_name} ({s.province}) [FK #{s.supplier_id}]
                  </option>
                ))}
              </select>
            </label>
            <label>
              Purchase Date
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </label>
          </div>

          <h3>Purchase Line Items (FK: fruit_id)</h3>
          {items.map((it, idx) => (
            <div className="line-item-row" key={idx}>
              <label>
                Fruit
                <select
                  value={it.fruit_id || activeFruits[0]?.fruit_id || ''}
                  onChange={(e) => updateItem(idx, 'fruit_id', e.target.value)}
                >
                  {activeFruits.map((f) => (
                    <option key={f.fruit_id} value={f.fruit_id}>
                      {f.fruit_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Package Size
                <select
                  value={it.packaging_size}
                  onChange={(e) => updateItem(idx, 'packaging_size', e.target.value)}
                >
                  {SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  required
                />
              </label>
              <label>
                Unit Cost (M)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.unit_cost}
                  onChange={(e) => updateItem(idx, 'unit_cost', e.target.value)}
                  required
                />
              </label>
              <button type="button" className="btn btn-danger" onClick={() => removeLine(idx)}>
                Remove
              </button>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              + Add Line Item
            </button>
            <div>
              <strong>Calculated Total: {fmtMoney(totalCost)} </strong>
              <button type="submit" className="btn btn-primary" style={{ marginLeft: '0.75rem' }}>
                Save Purchase
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2>Purchase History</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Supplier (FK)</th>
                <th>Date</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.purchase_id}>
                  <td>#{p.purchase_id}</td>
                  <td>
                    {p.business_name}{' '}
                    <span className="fk-tag">supplier_id: {p.supplier_id}</span>
                  </td>
                  <td>{fmtDate(p.purchase_date)}</td>
                  <td>{fmtMoney(p.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* -------------------- SALES TAB -------------------- */
function SalesTab({ vendors, fruits, stock, sales, sellingPrices, onRefresh, notify }) {
  const activeFruits = fruits.filter((f) => f.status === 'ACTIVE');
  const [vendorId, setVendorId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [items, setItems] = useState([
    { fruit_id: '', packaging_size: 'SMALL', quantity: 5 },
  ]);

  const getAvailable = (fId, size) => {
    const id = Number(fId || activeFruits[0]?.fruit_id);
    const match = stock.find((s) => s.fruit_id === id && s.packaging_size === size);
    return match ? match.available_quantity : 0;
  };

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const addLine = () =>
    setItems([
      ...items,
      {
        fruit_id: activeFruits[0]?.fruit_id || '',
        packaging_size: 'SMALL',
        quantity: 1,
      },
    ]);

  const removeLine = (idx) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const totalSale = items.reduce(
    (sum, it) =>
      sum + Number(it.quantity || 0) * Number(sellingPrices?.[it.packaging_size] || 0),
    0
  );

  const effectivePaid =
    paymentMethod === 'CASH' ? totalSale : Number(amountPaid === '' ? 0 : amountPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sellingPrices) {
      notify('error', 'Selling prices are not available. Refresh and try again.');
      return;
    }
    try {
      const payload = {
        vendor_id: Number(vendorId || vendors[0]?.vendor_id),
        sale_date: saleDate,
        payment_method: paymentMethod,
        amount_paid: effectivePaid,
        items: items.map((it) => ({
          fruit_id: Number(it.fruit_id || activeFruits[0]?.fruit_id),
          packaging_size: it.packaging_size,
          quantity: Number(it.quantity),
          unit_price: Number(sellingPrices[it.packaging_size]),
        })),
      };
      const res = await api.createSale(payload);
      notify(
        'success',
        `${res.message} — Status: ${res.payment_status}, Balance: ${fmtMoney(
          res.outstanding_balance
        )}`
      );
      setAmountPaid('');
      setItems([{ fruit_id: '', packaging_size: 'SMALL', quantity: 5 }]);
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-row">
          <h2>Record Vendor Sale (Deducts Stock)</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Vendor (FK: vendor_id)
              <select
                value={vendorId || vendors[0]?.vendor_id || ''}
                onChange={(e) => setVendorId(e.target.value)}
                required
              >
                {vendors.map((v) => (
                  <option key={v.vendor_id} value={v.vendor_id}>
                    {v.vendor_name} ({v.location}) [FK #{v.vendor_id}]
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sale Date
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </label>
            <label>
              Payment Method
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount Paid (M) {paymentMethod === 'CASH' && '(Auto Full)'}
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={paymentMethod === 'CASH'}
                value={paymentMethod === 'CASH' ? totalSale.toFixed(2) : amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>

          <h3>Sale Line Items (FK: fruit_id)</h3>
          {items.map((it, idx) => {
            const avail = getAvailable(it.fruit_id, it.packaging_size);
            return (
              <div className="line-item-row" key={idx}>
                <label>
                  Fruit
                  <select
                    value={it.fruit_id || activeFruits[0]?.fruit_id || ''}
                    onChange={(e) => updateItem(idx, 'fruit_id', e.target.value)}
                  >
                    {activeFruits.map((f) => (
                      <option key={f.fruit_id} value={f.fruit_id}>
                        {f.fruit_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Package (Avail: {avail})
                  <select
                    value={it.packaging_size}
                    onChange={(e) => updateItem(idx, 'packaging_size', e.target.value)}
                  >
                    {SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Unit Price (M)
                  <input
                    type="number"
                    value={sellingPrices?.[it.packaging_size] ?? ''}
                    readOnly
                    aria-label={`Unit price for ${it.packaging_size.toLowerCase()} package`}
                    required
                  />
                </label>
                <button type="button" className="btn btn-danger" onClick={() => removeLine(idx)}>
                  Remove
                </button>
              </div>
            );
          })}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              + Add Line Item
            </button>
            <div>
              <strong>Total: {fmtMoney(totalSale)} </strong>
              <button type="submit" className="btn btn-primary" style={{ marginLeft: '0.75rem' }}>
                Complete Sale
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2>Sales Ledger</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Vendor (FK)</th>
                <th>Date</th>
                <th>Method</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const bal = Number(s.total_amount) - Number(s.amount_paid);
                return (
                  <tr key={s.sale_id}>
                    <td>#{s.sale_id}</td>
                    <td>
                      {s.vendor_name}{' '}
                      <span className="fk-tag">vendor_id: {s.vendor_id}</span>
                    </td>
                    <td>{fmtDate(s.sale_date)}</td>
                    <td>{s.payment_method}</td>
                    <td>{fmtMoney(s.total_amount)}</td>
                    <td>{fmtMoney(s.amount_paid)}</td>
                    <td>{fmtMoney(bal)}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.payment_status === 'PAID'
                            ? 'badge-paid'
                            : s.payment_status === 'PARTIALLY_PAID'
                            ? 'badge-partial'
                            : 'badge-unpaid'
                        }`}
                      >
                        {s.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* -------------------- VENDORS TAB + GOOGLE MAPS -------------------- */
function VendorsTab({ vendors, onRefresh, notify }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(vendors);
  const [editingId, setEditingId] = useState(null);
  const [selectedMapQuery, setSelectedMapQuery] = useState('Maseru, Lesotho');
  const [form, setForm] = useState({
    vendor_name: '',
    phone_number: '',
    location: '',
    registration_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    setFiltered(vendors);
    if (vendors[0]?.location) {
      setSelectedMapQuery(`${vendors[0].location}, Lesotho`);
    }
  }, [vendors]);

  const handleSearch = async (val) => {
    setSearch(val);
    try {
      const list = await api.getVendors(val);
      setFiltered(list);
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateVendor(editingId, form);
        notify('success', 'Vendor updated');
      } else {
        await api.createVendor(form);
        notify('success', 'Vendor registered');
      }
      setSelectedMapQuery(`${form.location}, Lesotho`);
      setEditingId(null);
      setForm({
        vendor_name: '',
        phone_number: '',
        location: '',
        registration_date: new Date().toISOString().slice(0, 10),
      });
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-row">
          <h2>{editingId ? `Edit Vendor #${editingId}` : 'Register New Local Vendor'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Vendor Name
              <input
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                placeholder="e.g. Roma Market Traders"
                required
              />
            </label>
            <label>
              Phone Number
              <input
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="+26658000000"
                required
              />
            </label>
            <label>
              Location / District
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Maseru"
                required
              />
            </label>
            <label>
              Registration Date
              <input
                type="date"
                value={form.registration_date}
                onChange={(e) => setForm({ ...form, registration_date: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="row-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Update Vendor' : 'Register Vendor'}
            </button>
            {editingId && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    vendor_name: '',
                    phone_number: '',
                    location: '',
                    registration_date: new Date().toISOString().slice(0, 10),
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <GoogleMapBox
        query={selectedMapQuery}
        title={`Google Maps — Vendor Location: ${selectedMapQuery}`}
        subtitle="Click 'Map' on any vendor below to center the map on their location."
      />

      <div className="card">
        <div className="card-header-row">
          <h2>Registered Vendors & Outstanding Credit</h2>
          <input
            style={{ maxWidth: '280px' }}
            placeholder="Search name, phone, or location..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID (PK)</th>
                <th>Vendor Name</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Registered</th>
                <th>Outstanding Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.vendor_id}>
                  <td>{v.vendor_id}</td>
                  <td>{v.vendor_name}</td>
                  <td>{v.phone_number}</td>
                  <td>{v.location}</td>
                  <td>{fmtDate(v.registration_date)}</td>
                  <td>
                    <span
                      className={`badge ${
                        Number(v.outstanding_balance) > 0 ? 'badge-partial' : 'badge-paid'
                      }`}
                    >
                      {fmtMoney(v.outstanding_balance)}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMapQuery(`${v.location}, Lesotho`)}
                    >
                      Map
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingId(v.vendor_id);
                        setForm({
                          vendor_name: v.vendor_name,
                          phone_number: v.phone_number,
                          location: v.location,
                          registration_date: fmtDate(v.registration_date),
                        });
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* -------------------- SUPPLIERS TAB + GOOGLE MAPS -------------------- */
function SuppliersTab({ suppliers, onRefresh, notify }) {
  const [editingId, setEditingId] = useState(null);
  const [selectedMapQuery, setSelectedMapQuery] = useState('Johannesburg, Gauteng, South Africa');
  const [form, setForm] = useState({
    business_name: '',
    contact_person: '',
    phone: '',
    province: 'Gauteng',
    address: '',
  });

  useEffect(() => {
    if (suppliers[0]?.address) {
      setSelectedMapQuery(`${suppliers[0].address}, ${suppliers[0].province}`);
    }
  }, [suppliers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateSupplier(editingId, form);
        notify('success', 'Supplier updated');
      } else {
        await api.createSupplier(form);
        notify('success', 'Supplier added');
      }
      setSelectedMapQuery(`${form.address}, ${form.province}`);
      setEditingId(null);
      setForm({
        business_name: '',
        contact_person: '',
        phone: '',
        province: 'Gauteng',
        address: '',
      });
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteSupplier(id);
      notify('success', 'Supplier deleted');
      onRefresh();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header-row">
          <h2>{editingId ? `Edit Supplier #${editingId}` : 'Add South African Supplier'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Business Name
              <input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
              />
            </label>
            <label>
              Contact Person
              <input
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                required
              />
            </label>
            <label>
              Phone Number
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </label>
            <label>
              Province
              <select
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Address
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="row-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Update Supplier' : 'Add Supplier'}
            </button>
            {editingId && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    business_name: '',
                    contact_person: '',
                    phone: '',
                    province: 'Gauteng',
                    address: '',
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <GoogleMapBox
        query={selectedMapQuery}
        title={`Google Maps — Supplier Location: ${selectedMapQuery}`}
        subtitle="Click 'Map' on any supplier below to view their address on Google Maps."
      />

      <div className="card">
        <div className="card-header-row">
          <h2>Suppliers List</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID (PK)</th>
                <th>Business</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Province</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.supplier_id}>
                  <td>{s.supplier_id}</td>
                  <td>{s.business_name}</td>
                  <td>{s.contact_person}</td>
                  <td>{s.phone}</td>
                  <td>{s.province}</td>
                  <td>{s.address}</td>
                  <td className="row-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedMapQuery(`${s.address}, ${s.province}`)}
                    >
                      Map
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingId(s.supplier_id);
                        setForm({
                          business_name: s.business_name,
                          contact_person: s.contact_person,
                          phone: s.phone,
                          province: s.province,
                          address: s.address,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(s.supplier_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* -------------------- REPORTS & FOREIGN KEYS TAB -------------------- */
function ReportsTab({
  topFruits,
  topVendor,
  stockReport,
  revRange,
  setRevRange,
  revenueData,
  onRunRevenue,
}) {
  return (
    <>
      <div className="card">
        <div className="card-header-row">
          <h2>Revenue Report by Date Range</h2>
        </div>
        <div className="form-grid" style={{ maxWidth: '620px', alignItems: 'end' }}>
          <label>
            Start Date
            <input
              type="date"
              value={revRange.start}
              onChange={(e) => setRevRange({ ...revRange, start: e.target.value })}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={revRange.end}
              onChange={(e) => setRevRange({ ...revRange, end: e.target.value })}
            />
          </label>
          <button className="btn btn-primary" onClick={onRunRevenue}>
            Run Report
          </button>
        </div>
        {revenueData && (
          <div className="grid-4" style={{ marginTop: '1rem', marginBottom: 0 }}>
            {Object.entries(revenueData).map(([k, v]) => (
              <div className="kpi-card" key={k}>
                <div className="kpi-label">{k.replace(/_/g, ' ')}</div>
                <div className="kpi-value" style={{ fontSize: '1.25rem' }}>
                  {typeof v === 'number' ||
                  (!isNaN(Number(v)) &&
                    !k.includes('date') &&
                    !k.includes('count') &&
                    !k.includes('sales'))
                    ? fmtMoney(v)
                    : String(v ?? '-')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header-row">
            <h2>Top Selling Fruits</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {topFruits[0] ? (
                    Object.keys(topFruits[0]).map((col) => (
                      <th key={col}>{col.replace(/_/g, ' ')}</th>
                    ))
                  ) : (
                    <th>Data</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {topFruits.length === 0 ? (
                  <tr>
                    <td>No sales records yet.</td>
                  </tr>
                ) : (
                  topFruits.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{String(val)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <h2>Highest Volume Vendor</h2>
          </div>
          {topVendor && typeof topVendor === 'object' ? (
            <table>
              <tbody>
                {Object.entries(topVendor).map(([k, v]) => (
                  <tr key={k}>
                    <th>{k.replace(/_/g, ' ')}</th>
                    <td>{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No vendor sales recorded yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2>Database Foreign Key Relationships (MySQL)</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Child Table</th>
                <th>Foreign Key Column</th>
                <th>References</th>
                <th>On Delete / Update</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>purchases</td>
                <td>
                  <span className="fk-tag">supplier_id</span>
                </td>
                <td>suppliers(supplier_id)</td>
                <td>ON UPDATE CASCADE, ON DELETE RESTRICT</td>
              </tr>
              <tr>
                <td>purchase_details</td>
                <td>
                  <span className="fk-tag">purchase_id</span>
                  <span className="fk-tag">fruit_id</span>
                </td>
                <td>purchases(purchase_id), fruits(fruit_id)</td>
                <td>CASCADE on purchase / RESTRICT on fruit</td>
              </tr>
              <tr>
                <td>sales</td>
                <td>
                  <span className="fk-tag">vendor_id</span>
                </td>
                <td>vendors(vendor_id)</td>
                <td>ON UPDATE CASCADE, ON DELETE RESTRICT</td>
              </tr>
              <tr>
                <td>sales_details</td>
                <td>
                  <span className="fk-tag">sale_id</span>
                  <span className="fk-tag">fruit_id</span>
                </td>
                <td>sales(sale_id), fruits(fruit_id)</td>
                <td>CASCADE on sale / RESTRICT on fruit</td>
              </tr>
              <tr>
                <td>stock</td>
                <td>
                  <span className="fk-tag">fruit_id</span>
                </td>
                <td>fruits(fruit_id)</td>
                <td>ON UPDATE CASCADE, ON DELETE RESTRICT</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2>Full Stock Summary Report</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {stockReport[0] ? (
                  Object.keys(stockReport[0]).map((col) => (
                    <th key={col}>{col.replace(/_/g, ' ')}</th>
                  ))
                ) : (
                  <th>Data</th>
                )}
              </tr>
            </thead>
            <tbody>
              {stockReport.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j}>{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
