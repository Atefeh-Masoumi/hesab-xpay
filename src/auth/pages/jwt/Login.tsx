import { type MouseEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { useAuthContext } from '@/auth';
import { useLayout } from '@/providers';
import { Alert } from '@/components';

const loginSchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .min(10, 'تعداد ارقام درست نیست باید 11 رقم باشد')
    .required('شماره موبایل الزامی است'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('رمز عبور الزامی است'),

  remember: Yup.boolean()
});

const initialValues = {
  phoneNumber: '',
  password: '',
  code: '',
  remember: false
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const { currentLayout } = useLayout();
  const [step, setStep] = useState<'login' | 'code'>('login');
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const [twoFactorData, setTwoFactorData] = useState<{
    phoneNumber: string;
    password: string;
  } | null>(null);

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      try {
        if (!login) {
          throw new Error('JWTProvider is required for this form.');
        }
        if (step === 'login') {
          // Only advance to code step, do not call API
          setTwoFactorData({ phoneNumber: values.phoneNumber, password: values.password });
          setStep('code');
          setLoading(false);
          return;
        } else if (step === 'code' && twoFactorData) {
          // Call login API with phone, password, and code
          const code = codeInputs.join('');
          await login(twoFactorData.phoneNumber, twoFactorData.password, code);
          if (values.remember) {
            localStorage.setItem('phoneNumber', twoFactorData.phoneNumber);
          } else {
            localStorage.removeItem('phoneNumber');
          }
          navigate(from, { replace: true });
        }
      } catch {
        setStatus('The login details are incorrect');
        setSubmitting(false);
      }
      setLoading(false);
    }
  });
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasteData = event.clipboardData.getData("Text").trim();
    if (!/^[0-9]+$/.test(pasteData)) return; 
  
    const digits = pasteData.split("").slice(0, codeInputs.length);
    const newInputs = [...codeInputs];
  
    digits.forEach((digit, i) => {
      newInputs[i] = digit;
    });
  
    setCodeInputs(newInputs);
  
    const lastIndex = digits.length - 1;
    const lastInput = document.querySelector<HTMLInputElement>(`#code-input-${lastIndex}`);
    lastInput?.focus();
  };
  
  const handleInputChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);
    // Move to next input if value entered
    if (value && index < codeInputs.length - 1) {
      const nextInput = document.querySelector<HTMLInputElement>(`#code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="card max-w-[390px] w-full" >
      <form
        className="card-body flex flex-col gap-5 p-10"
        onSubmit={formik.handleSubmit}
        noValidate
      >
        {formik.status && <Alert variant="danger">{formik.status}</Alert>}

        {step === 'login' && (
          <>
            <div className="flex flex-col gap-1 " dir='rtl'>
              <label className="form-label text-gray-900 ">شماره موبایل </label>
              <label className="input">
                <input
                  dir="ltr"
                  placeholder="Enter Phone Number"
                  autoComplete="off"
                  {...formik.getFieldProps('phoneNumber')}
                  className={clsx('form-control', {
                    'is-invalid': formik.touched.phoneNumber && formik.errors.phoneNumber
                  })}
                />
              </label>
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <span role="alert" className="text-danger text-xs mt-1">
                  {formik.errors.phoneNumber}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1" dir='rtl'>
              <div className="flex items-center justify-between gap-1">
                <label className="form-label text-gray-900">رمز عبور</label>
              </div>
              <label className="input">
                <input
                  dir="ltr"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  autoComplete="off"
                  {...formik.getFieldProps('password')}
                  className={clsx('form-control', {
                    'is-invalid': formik.touched.password && formik.errors.password
                  })}
                />
                <button className="btn btn-icon" onClick={togglePassword}>
                  <KeenIcon
                    icon="eye"
                    className={clsx('text-gray-500', { hidden: showPassword })}
                  />
                  <KeenIcon
                    icon="eye-slash"
                    className={clsx('text-gray-500', { hidden: !showPassword })}
                  />
                </button>
              </label>
              {formik.touched.password && formik.errors.password && (
                <span role="alert" className="text-danger text-xs mt-1">
                  {formik.errors.password}
                </span>
              )}
            </div>
          </>
        )}

        {step === 'code' && (
          <div className="flex flex-col gap-1" >
            <label className="form-label text-gray-900">کد تایید</label>
            <div className="flex flex-wrap justify-center gap-2.5" dir="ltr">
              {codeInputs.map((value, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  maxLength={1}
                  className="input focus:border-primary-clarity focus:ring focus:ring-primary-clarity size-10 shrink-0 px-0 text-center"
                  value={value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onPaste={handlePaste}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow"
          disabled={
            loading || formik.isSubmitting || (step === 'code' && codeInputs.some((v) => !v))
          }
        >
          {loading ? 'Please wait...' : step === 'login' ? 'ورود ' : 'تایید کد'}
        </button>
      </form>
    </div>
  );
};

export { Login };
