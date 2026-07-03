import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiMapPin, FiCreditCard, FiCheck, FiChevronRight } from 'react-icons/fi';
import api from '../../config/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCart, clearCart } from '../../store/slices/cartSlice';
import { CURRENCY, PAYMENT_METHODS } from '../../config/constants';
import toast from 'react-hot-toast';

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  street: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, summary } = useAppSelector((s) => s.cart);
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('COD');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    let active = true;
    dispatch(fetchCart());
    api.get('/users/me/addresses').then(r => {
      if (!active) return;
      const list = r.data.data ?? [];
      console.log('[Checkout] Initial addresses loaded:', list.length, list);
      setAddresses(list);
      const def = list.find((a: any) => a.isDefault);
      if (def) { console.log('[Checkout] Auto-selecting default:', def.id); setSelectedAddress(def.id); }
      else if (list.length > 0) { console.log('[Checkout] Auto-selecting first:', list[0].id); setSelectedAddress(list[0].id); }
      else setShowNewAddress(true);
    }).catch(() => {});
    return () => { active = false; };
  }, [dispatch]);

  // Defensive auto-select: if addresses load/update but nothing is selected, pick default or first
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a: any) => a.isDefault);
      const pick = def ? def.id : addresses[0].id;
      console.log('[Checkout] Defensive auto-select:', pick);
      setSelectedAddress(pick);
    }
  }, [addresses, selectedAddress]);

  const onAddAddress = async (data: AddressForm) => {
    try {
      const { data: res } = await api.post('/users/me/addresses', {
        ...data, label: 'Home', country: 'Nepal', isDefault: addresses.length === 0,
      });
      console.log('[Checkout] POST /addresses response:', res);
      const newAddress = res?.data;
      if (newAddress) {
        const newAddressId: string | undefined = newAddress.id;
        console.log('[Checkout] new address id:', newAddressId);

        // Update addresses list using functional form (avoids stale closure)
        setAddresses((prev: any[]) => [...prev, newAddress]);
        // Set the newly created address as selected
        if (newAddressId) setSelectedAddress(newAddressId);
        setShowNewAddress(false);
        reset();
        toast.success('Address added');
      } else {
        toast.error('Failed to parse added address response');
      }
    } catch (err) {
      console.error('[Checkout] onAddAddress error:', err);
      toast.error('Failed to add address');
    }
  };


  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a shipping address'); return; }
    setProcessing(true);
    try {
      const { data } = await api.post('/orders', {
        addressId: selectedAddress,
        paymentMethod: selectedPayment,
      });

      const order = data.data;

      if (selectedPayment === 'COD') {
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate(`/orders/${order.id}`);
      } else if (selectedPayment === 'ESEWA') {
        const { data: payData } = await api.post('/payments/esewa/initiate', { orderId: order.id });
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payData.data.paymentUrl;
        Object.entries(payData.data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden'; input.name = key; input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else if (selectedPayment === 'KHALTI') {
        const { data: payData } = await api.post('/payments/khalti/initiate', { orderId: order.id });
        window.location.href = payData.data.paymentUrl;
      } else if (selectedPayment === 'STRIPE') {
        toast.error('Stripe integration requires client-side SDK setup');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setProcessing(false); }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="mt-4 px-6 py-3 rounded-xl gradient-primary text-white font-semibold">Browse Products</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[{ n: 1, label: 'Address' }, { n: 2, label: 'Payment' }, { n: 3, label: 'Review' }].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <button onClick={() => n < step ? setStep(n) : null}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${step >= n ? 'gradient-primary text-white' : 'bg-surface-100 text-surface-700/50'}`}>
              {step > n ? <FiCheck size={16} /> : n}
            </button>
            <span className={`text-sm font-medium hidden sm:block ${step >= n ? 'text-surface-900' : 'text-surface-700/50'}`}>{label}</span>
            {n < 3 && <FiChevronRight className="text-surface-200 mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-surface-200/60 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FiMapPin /> Shipping Address</h2>
              <div className="space-y-3">
                {addresses.map(addr => (
                  <label key={addr.id} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${selectedAddress === addr.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-700/30'}`}>
                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-primary-600" />
                    <div>
                      <p className="font-semibold text-sm">{addr.fullName} <span className="text-surface-700/50 font-normal">({addr.label})</span></p>
                      <p className="text-sm text-surface-700/70">{addr.street}, {addr.city}, {addr.state}</p>
                      <p className="text-sm text-surface-700/50">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>

              {!showNewAddress ? (
                <button onClick={() => setShowNewAddress(true)} className="mt-4 text-sm text-primary-600 font-medium">+ Add New Address</button>
              ) : (
                <form onSubmit={handleSubmit(
                  (data) => {
                    console.log('[Checkout] Form submit success, calling onAddAddress:', data);
                    onAddAddress(data);
                  },
                  (errs) => {
                    console.error('[Checkout] Form submit validation failed:', errs);
                    toast.error('Please check the form for errors');
                  }
                )} className="mt-4 p-4 bg-surface-50 rounded-xl space-y-3">
                  <h3 className="font-semibold text-sm">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><input {...register('fullName')} placeholder="Full Name" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />{errors.fullName && <p className="text-danger-500 text-xs mt-0.5">{errors.fullName.message}</p>}</div>
                    <div><input {...register('phone')} placeholder="Phone" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />{errors.phone && <p className="text-danger-500 text-xs mt-0.5">{errors.phone.message}</p>}</div>
                  </div>
                  <div className="space-y-1">
                    <input {...register('street')} placeholder="Street Address" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                    {errors.street && <p className="text-danger-500 text-xs mt-0.5">{errors.street.message}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input {...register('city')} placeholder="City" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                      {errors.city && <p className="text-danger-500 text-xs mt-0.5">{errors.city.message}</p>}
                    </div>
                    <div>
                      <input {...register('state')} placeholder="State/Province" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                      {errors.state && <p className="text-danger-500 text-xs mt-0.5">{errors.state.message}</p>}
                    </div>
                    <div>
                      <input {...register('zipCode')} placeholder="ZIP (optional)" className="w-full h-10 px-3 rounded-lg border border-surface-200 text-sm outline-none focus:border-primary-400" />
                      {errors.zipCode && <p className="text-danger-500 text-xs mt-0.5">{errors.zipCode.message}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit"
                      onClick={() => console.log('[Checkout] Save Address button clicked')}
                      className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium">Save Address</button>
                    <button type="button" onClick={() => setShowNewAddress(false)} className="px-4 py-2 rounded-lg bg-surface-200 text-sm font-medium">Cancel</button>
                  </div>
                </form>
              )}

              <button onClick={() => {
                console.log('[Checkout] Continue clicked — selectedAddress:', selectedAddress, '| addresses:', addresses.length);
                if (selectedAddress) setStep(2); else toast.error('Select an address');
              }}
                className="w-full h-12 mt-6 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition">Continue to Payment</button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-surface-200/60 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FiCreditCard /> Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(method => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${selectedPayment === method.id ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-700/30'}`}>
                    <input type="radio" name="payment" checked={selectedPayment === method.id} onChange={() => setSelectedPayment(method.id)} className="accent-primary-600" />
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-medium text-sm">{method.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border-2 border-surface-200 font-semibold hover:bg-surface-50 transition">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition">Review Order</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-surface-200/60 p-6">
              <h2 className="text-lg font-bold mb-4">Review Your Order</h2>

              {/* Address summary */}
              {(() => { const addr = addresses.find(a => a.id === selectedAddress); return addr ? (
                <div className="p-4 bg-surface-50 rounded-xl mb-4">
                  <p className="text-xs font-semibold text-surface-700/50 uppercase mb-1">Shipping to</p>
                  <p className="font-semibold text-sm">{addr.fullName}</p>
                  <p className="text-sm text-surface-700/70">{addr.street}, {addr.city}, {addr.state}</p>
                </div>
              ) : null; })()}

              {/* Payment summary */}
              <div className="p-4 bg-surface-50 rounded-xl mb-4">
                <p className="text-xs font-semibold text-surface-700/50 uppercase mb-1">Payment Method</p>
                <p className="font-semibold text-sm">{PAYMENT_METHODS.find(m => m.id === selectedPayment)?.icon} {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.name}</p>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <img src={item.product.images?.[0]?.url || 'https://via.placeholder.com/50'} alt="" className="w-12 h-12 rounded-lg object-contain bg-surface-50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-surface-700/50">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold">{CURRENCY} {(Number(item.product.price) * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl border-2 border-surface-200 font-semibold hover:bg-surface-50 transition">Back</button>
                <button onClick={handlePlaceOrder} disabled={processing}
                  className="flex-1 h-12 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50">
                  {processing ? 'Processing...' : `Place Order — ${CURRENCY} ${Math.round(summary.total).toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-surface-200/60 p-6 sticky top-36">
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-surface-700/60">Items ({summary.itemCount})</span><span>{CURRENCY} {summary.subtotal.toLocaleString()}</span></div>
              {summary.discount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{CURRENCY} {summary.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span className="text-surface-700/60">Tax</span><span>{CURRENCY} {Math.round(summary.tax).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-surface-700/60">Delivery</span><span>{summary.deliveryFee === 0 ? <span className="text-success-600">FREE</span> : `${CURRENCY} ${summary.deliveryFee}`}</span></div>
              <hr className="border-surface-200" />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{CURRENCY} {Math.round(summary.total).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
