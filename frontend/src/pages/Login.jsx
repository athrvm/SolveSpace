import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from "../authSlice"
import { useEffect, useState } from 'react';

const signupSchema = z.object({
  emailId: z.email("Invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

function Login() {

  const [attempted, setAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]); // with the changing value in dependency array, it preferred to keep a constant value like navigate, so that it will not change and the useEffect will not run again and again. If we put isAuthenticated in the dependency array, then it will run again and again whenever isAuthenticated changes. So we put navigate in the dependency array.

  const onSubmit = (data) => {
    setAttempted(true);
    dispatch(loginUser(data));
  };

  return (
    <div className="auth-page"> {/* Added bg for contrast */}
      <div className="card auth-card bg-base-100">
        <div className="card-body">
          <p className="eyebrow">SOLVESPACE / ACCOUNT</p><h1>Welcome back</h1><p className="auth-intro">Continue your practice. Pick up where you left off.</p> {/* Added mb-6 */}


          <form onSubmit={handleSubmit(onSubmit)}>
            {attempted && error && <div className="alert alert-error mb-4" role="alert">{error}</div>}
            <div className="form-control"> {/* Removed mt-4 from first form-control for tighter spacing to title or global error */}
              <label className="label"> {/* Removed mb-1, default spacing should be fine */}
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-bordered w-full ${errors.emailId ? 'input-error' : ''}`}
                id="emailId" autoComplete="email" aria-invalid={!!errors.emailId} {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-sm mt-1">{errors.emailId.message}</span>
              )}
            </div>

            <div className="form-control mt-4">
              <label className="label" htmlFor="password">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-error text-sm mt-1">{errors.password.message}</span>
              )}
            </div>

            <div className="form-control mt-8 flex justify-center">
              <button
                type="submit"
                className="btn btn-primary" // Added btn-disabled for better UX with loading
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </div>
          </form>
          <div className="text-center mt-6">
            <span className="text-sm">
              Don't have an account?{' '} {/* Adjusted text slightly */}
              <NavLink to="/signup" className="link link-primary">
                Sign Up
              </NavLink>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
