import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser } from '../authSlice'
import { useState, useEffect } from 'react';

const signupSchema = z.object({
  firstName: z.string().min(3, "Enter at least 3 characters"),
  emailId: z.email("Invalid Email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[0-9]/, "Include a number")
    .regex(/[^A-Za-z0-9]/, "Include a special character")
});
// Strong password validation as per backend passowrd validation.

function Signup() {

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
  }, [isAuthenticated, navigate]); // If user is already authenticated, then redirect him to homepage. So we check if isAuthenticated is true, then we redirect him to homepage. If he is not authenticated, then we show him the signup page. This useEffect will run whenever isAuthenticated or navigate changes.

  const onSubmit = (data) => {
    setAttempted(true);
    dispatch(registerUser(data)); // This will dispatch the registerUser action with the form data to the Redux store. The action will handle the API call and update the state accordingly.  And then in authslice.js, the extraReducers will handle the different states of the registerUser action (pending, fulfilled, rejected) and update the state accordingly. This data will be sent to the backend API for user registration. If the registration is successful, the user will be redirected to the home page. If there is an error, it will be displayed on the form. When this data is sent to the Redux store, sotre will recognize it as asyncthunk action and will send it to authSlice.js where the extraReducers will handle the different states of the registerUser action (pending, fulfilled, rejected) and update the state accordingly.
  };

  return (
    <div className="auth-page"> {/* Added a light bg for contrast */}
      <div className="card auth-card bg-base-100">
        <div className="card-body">
          <p className="eyebrow">SOLVESPACE / ACCOUNT</p><h1>Create your account</h1><p className="auth-intro">A focused workspace for your next solution.</p> {/* Added mb-6 for spacing */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {attempted && error && <div className="alert alert-error mb-4" role="alert">{error}</div>}
            {/* First Name Field */}
            <div className="form-control">
              <label className="label" htmlFor="firstName">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                placeholder="John"
                className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
                id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register('firstName')}
              />
              {errors.firstName && (
                <span className="text-error text-sm mt-1">{errors.firstName.message}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="form-control mt-4">
              <label className="label" htmlFor="emailId">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className={`input input-bordered w-full ${errors.emailId ? 'input-error' : ''}`} // Ensure w-full for consistency
                id="emailId" autoComplete="email" aria-invalid={!!errors.emailId} {...register('emailId')}
              />
              {errors.emailId && (
                <span className="text-error text-sm mt-1">{errors.emailId.message}</span>
              )}
            </div>

            {/* Password Field with Toggle */}
            <div className="form-control mt-4">
              <label className="label" htmlFor="password">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  // Added pr-10 (padding-right) to make space for the button
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" // Added transform for better centering, styling
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"} // Accessibility
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

            {/* Submit Button */}
            <div className="form-control mt-8 flex justify-center">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Login Redirect */}
          <div className="text-center mt-6"> {/* Increased mt for spacing */}
            <span className="text-sm">
              Already have an account?{' '}
              <NavLink to="/login" className="link link-primary">
                Login
              </NavLink>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;

