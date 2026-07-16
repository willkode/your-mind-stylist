import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConsultationQuestionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const autosaveTimeoutRef = useRef(null);

  // Fetch form fields from ConsultationForm entity with aggressive retry logic
  useEffect(() => {
    let isMounted = true;

    const fetchFields = async () => {
      let retries = 0;
      const maxRetries = 5;

      const attemptFetch = async () => {
        try {
          const fields = await base44.entities.ConsultationForm.list(undefined, 100);
          if (isMounted && fields && fields.length > 0) {
            console.log('Fetched ConsultationForm fields:', fields);
            // Extract data from entity wrapper if needed
            const processedFields = fields.map(field => {
              return field.data || field;
            }).filter(f => f && f.field_name);
            console.log('Processed fields count:', processedFields.length);
            if (processedFields.length > 0) {
              setFormFields(processedFields);
              setLoading(false);
              return;
            }
          }
          // If no fields or incomplete, retry
          if (retries < maxRetries) {
            retries++;
            const delay = Math.pow(2, retries) * 1000;
            console.log(`Retrying fetch (attempt ${retries}/${maxRetries}) after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptFetch();
          } else {
            if (isMounted) {
              console.error('Failed to load form fields after max retries');
              setFormFields([]);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error("Error fetching form fields:", error);
          if (retries < maxRetries) {
            retries++;
            const delay = Math.pow(2, retries) * 1000;
            console.log(`Retrying fetch (attempt ${retries}/${maxRetries}) after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptFetch();
          } else {
            if (isMounted) {
              setFormFields([]);
              setLoading(false);
            }
          }
        }
      };

      setLoading(true);
      await attemptFetch();
    };

    fetchFields();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-set step to first step with fields
  useEffect(() => {
    if (formFields.length > 0 && step === 1) {
      const availableSteps = [...new Set(formFields.map(f => parseInt(f.step, 10)))].sort((a, b) => a - b);
      if (availableSteps.length > 0 && availableSteps[0] > 1) {
        setStep(availableSteps[0]);
      }
    }
  }, [formFields]);
  
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  
  // Get fields for current step
  const currentStepFields = formFields
    .filter(field => {
      // Handle both string and number step values
      const fieldStep = parseInt(field.step, 10);
      return fieldStep === step;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('consultationFormData');
    const savedStep = localStorage.getItem('consultationFormStep');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }
  }, []);

  // Initialize formData when fields are loaded
  useEffect(() => {
    if (formFields.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const initialData = formFields.reduce((acc, field) => {
        if (field.field_name === 'signature_date') {
          acc[field.field_name] = today;
        } else {
          acc[field.field_name] = field.field_type === 'checkbox' ? false : '';
        }
        return acc;
      }, {});
      
      const savedData = localStorage.getItem('consultationFormData');
      if (savedData) {
        try {
          const parsedSaved = JSON.parse(savedData);
          // Merge saved data with newly initialized fields
          setFormData({ ...initialData, ...parsedSaved });
        } catch (error) {
          console.error('Failed to load saved form data:', error);
          setFormData(initialData);
        }
      } else {
        setFormData(initialData);
      }
    }
  }, [formFields]);

  // Autosave formData to localStorage with debounce
  useEffect(() => {
    if (Object.keys(formData).length === 0) return;
    
    setIsSaving(true);
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    autosaveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('consultationFormData', JSON.stringify(formData));
        localStorage.setItem('consultationFormStep', step.toString());
        setIsSaving(false);
      } catch (error) {
        console.error('Failed to autosave form data:', error);
        setIsSaving(false);
      }
    }, 1000);
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [formData, step]);
  
  // Debug logging
  React.useEffect(() => {
    console.log('Current step:', step);
    console.log('All form fields:', formFields);
    console.log('Filtered fields for step:', currentStepFields);
    console.log('Form data:', formData);
  }, [step, formFields, currentStepFields, formData]);

  const WELCOME_LETTER_URL = "https://media.base44.com/files/public/693a98b3e154ab3b36c88ebb/6abd9ef03_Welcome-letter.pdf";
  const CLIENT_BOR_URL = "https://base44.app/api/apps/693a98b3e154ab3b36c88ebb/files/public/693a98b3e154ab3b36c88ebb/5363d88f4_ClientBOR.pdf";
  const CLIENT_BOR_MINORS_URL = "https://base44.app/api/apps/693a98b3e154ab3b36c88ebb/files/public/693a98b3e154ab3b36c88ebb/41b22fa7e_ClientBOR-minors.pdf";

  const handleCheckboxChange = (fieldName, value) => {
    setFormData(prev => {
      const current = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      return {
        ...prev,
        [fieldName]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const intake = await base44.entities.ConsultationIntake.create({
        ...formData,
        status: "submitted",
        submitted_date: new Date().toISOString()
      });

      // Send confirmation + notification emails with PDF
      await base44.functions.invoke('sendIntakeEmails', { intake_id: intake.id });

      // Navigate to confirmation
      navigate(createPageUrl('ConsultationSubmitted'));
    } catch (error) {
      console.error("Failed to submit:", error);
      alert("There was an error submitting your form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isStepValid = () => {
    const requiredFields = currentStepFields.filter(field => {
      if (!field.required) return false;
      if (field.conditional_field) {
        const condVal = formData[field.conditional_field];
        if (Array.isArray(condVal)) {
          if (!condVal.includes(field.conditional_value)) return false;
        } else if (condVal !== field.conditional_value) {
          return false;
        }
      }
      return true;
    });
    if (requiredFields.length === 0) return true;
    return requiredFields.every(field => {
      const value = formData[field.field_name];
      if (field.field_type === 'checkbox' && field.options && field.options.length > 0) {
        return Array.isArray(value) && value.length > 0;
      }
      if (field.field_type === 'radio') {
        return value !== undefined && value !== null && value !== '';
      }
      return value !== undefined && value !== null && String(value).trim().length > 0;
    });
  };
  
  const isFieldEmpty = (field) => {
    const value = formData[field.field_name];
    if (field.field_type === 'checkbox' && field.options && field.options.length > 0) {
      return !Array.isArray(value) || value.length === 0;
    }
    return value === undefined || value === null || String(value).trim().length === 0;
  };

  const renderField = (field) => {
    // Handle conditional fields
    if (field.conditional_field) {
      const condVal = formData[field.conditional_field];
      if (Array.isArray(condVal)) {
        if (!condVal.includes(field.conditional_value)) return null;
      } else if (condVal !== field.conditional_value) {
        return null;
      }
    }
    
    const value = formData[field.field_name];
    const hasError = showValidationErrors && field.required && isFieldEmpty(field);
    const onChange = (newValue) => {
      setFormData(prev => ({...prev, [field.field_name]: newValue}));
    };
    
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <div key={field.field_name}>
            <Label htmlFor={field.field_name}>
              {field.label} {field.required && '*'}
            </Label>
            {field.help_text && (
              <p className="text-xs text-[#2B2725]/60 mt-1">{field.help_text}</p>
            )}
            <Input
              id={field.field_name}
              type={field.field_type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`mt-1 ${hasError ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              placeholder={field.help_text}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">This field is required</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.field_name}>
            <Label htmlFor={field.field_name}>
              {field.label} {field.required && '*'}
            </Label>
            {field.help_text && (
              <p className="text-xs text-[#2B2725]/60 mt-1">{field.help_text}</p>
            )}
            {!value && (
              <p className="text-xs text-[#D8B46B] mt-1 font-medium">Please click to select a date</p>
            )}
            <Input
              id={field.field_name}
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`mt-1 ${hasError ? 'border-red-400 ring-1 ring-red-400' : ''} ${!value ? 'border-[#D8B46B] ring-1 ring-[#D8B46B]/50' : ''}`}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">This field is required</p>}
          </div>
        );
        
      case 'textarea':
      case 'conditional_text':
        return (
          <div key={field.field_name}>
            <Label htmlFor={field.field_name}>
              {field.label} {field.required && '*'}
            </Label>
            {field.help_text && (
              <p className="text-xs text-[#2B2725]/60 mt-1">{field.help_text}</p>
            )}
            <Textarea
              id={field.field_name}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`mt-1 min-h-[100px] ${hasError ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              placeholder={field.help_text}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">This field is required</p>}
          </div>
        );
        
      case 'radio':
        return (
          <div key={field.field_name}>
            <Label>
              {field.label} {field.required && '*'}
            </Label>
            {field.help_text && (
              <p className="text-xs text-[#2B2725]/60 mt-1">{field.help_text}</p>
            )}
            <RadioGroup
              value={value || ''}
              onValueChange={onChange}
              className={`mt-2 ${hasError ? 'rounded-md ring-1 ring-red-400 p-2' : ''}`}
            >
              {field.options && field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.field_name}-${option}`} />
                  <Label htmlFor={`${field.field_name}-${option}`} className="cursor-pointer capitalize">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && <p className="text-xs text-red-500 mt-1">This field is required</p>}
          </div>
        );
        
      case 'checkbox':
        // Multi-option checkbox (array of options)
        if (field.options && field.options.length > 0) {
          const checked = Array.isArray(value) ? value : [];
          return (
            <div key={field.field_name}>
              <Label className={`font-medium ${hasError ? 'text-red-500' : ''}`}>
                {field.label} {field.required && '*'}
              </Label>
              {field.help_text && (
                <p className="text-xs text-[#2B2725]/60 mt-1 mb-2">{field.help_text}</p>
              )}
              {/* Client Bill of Rights links for disclosure forms */}
              {field.field_name === 'disclosure_forms' && (
                <div className="mt-2 mb-3 p-3 bg-[#1E3A32]/5 border border-[#D8B46B]/30 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-[#1E3A32]">Important Documents:</p>
                  <a href={CLIENT_BOR_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#D8B46B] hover:text-[#1E3A32] underline transition-colors">
                    📄 Client Bill of Rights (PDF)
                  </a>
                  <a href={CLIENT_BOR_MINORS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#D8B46B] hover:text-[#1E3A32] underline transition-colors">
                    📄 Client Bill of Rights — Minors (PDF)
                  </a>
                </div>
              )}
              <div className="mt-2 space-y-2">
                {field.options.map((option) => {
                  const optionLabel = field.field_name === 'disclosure_forms' && option.toLowerCase().includes('welcome letter')
                    ? <span>{option} — <a href={WELCOME_LETTER_URL} target="_blank" rel="noopener noreferrer" className="text-[#D8B46B] underline hover:text-[#1E3A32] transition-colors">Download PDF</a></span>
                    : option;
                  return (
                    <div key={option} className="flex items-center gap-3">
                      <Checkbox
                        id={`${field.field_name}-${option}`}
                        checked={checked.includes(option)}
                        onCheckedChange={() => handleCheckboxChange(field.field_name, option)}
                      />
                      <Label htmlFor={`${field.field_name}-${option}`} className="cursor-pointer leading-relaxed font-normal">
                        {optionLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        // Single boolean checkbox
        return (
          <div key={field.field_name} className="flex items-start gap-3">
            <Checkbox
              id={field.field_name}
              checked={value === true}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.field_name} className="cursor-pointer leading-relaxed">
              {field.label} {field.required && '*'}
              {field.help_text && (
                <span className="block text-xs text-[#2B2725]/60 mt-1">{field.help_text}</span>
              )}
            </Label>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D8B46B] mx-auto mb-4"></div>
          <p className="text-[#2B2725]/60">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5EF] pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="text-[#D8B46B]" size={20} />
            <span className="text-sm text-[#2B2725]/60">Secure & Confidential</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[#1E3A32] mb-4">
            Initial Consultation Questionnaire
          </h1>
          <p className="text-[#2B2725]/70 max-w-2xl mx-auto">
            This form is completed online for your convenience and privacy. Information submitted is stored securely and accessed only for the purpose of your consultation.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#2B2725]/60">Step {step} of {totalSteps}</span>
            <span className="text-sm text-[#2B2725]/60">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                {currentStepFields.length > 0 && (
                  <div className="space-y-6">
                    <CardTitle className="font-serif text-2xl text-[#1E3A32] mb-6">
                      {currentStepFields[0]?.step_title}
                    </CardTitle>
                    
                    {currentStepFields[0]?.step_description && (
                      <p className="text-[#2B2725]/70 mb-6">
                        {currentStepFields[0].step_description}
                      </p>
                    )}
                    
                    <div className="space-y-6">
                      {currentStepFields.map(field => renderField(field))}
                    </div>
                  </div>
                )}
                
                {currentStepFields.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[#2B2725]/60">No fields configured for this step yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="border-[#D8B46B] text-[#1E3A32]"
            >
              Previous
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              onClick={() => {
                if (isStepValid()) {
                  setShowValidationErrors(false);
                  setStep(step + 1);
                } else {
                  setShowValidationErrors(true);
                }
              }}
              className="bg-[#1E3A32] hover:bg-[#2B2725] text-[#F9F5EF] ml-auto"
            >
              Next
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-3 ml-auto">
              {/* Bill of Rights links on final step */}
              <div className="text-right text-sm text-[#2B2725]/70 space-y-1">
                <p>Before submitting, please review:</p>
                <a href={CLIENT_BOR_URL} target="_blank" rel="noopener noreferrer" className="block text-[#D8B46B] hover:text-[#1E3A32] underline transition-colors">
                  Client Bill of Rights (PDF)
                </a>
                <a href={CLIENT_BOR_MINORS_URL} target="_blank" rel="noopener noreferrer" className="block text-[#D8B46B] hover:text-[#1E3A32] underline transition-colors">
                  Client Bill of Rights — Minors (PDF)
                </a>
              </div>
              <Button
                onClick={() => {
                  if (isStepValid()) {
                    setShowValidationErrors(false);
                    handleSubmit();
                  } else {
                    setShowValidationErrors(true);
                  }
                }}
                disabled={submitting}
                className="bg-[#D8B46B] hover:bg-[#F9F5EF] text-[#1E3A32]"
              >
                {submitting ? "Submitting..." : "Submit Questionnaire"}
                {!submitting && <CheckCircle2 className="ml-2" size={16} />}
              </Button>
            </div>
          )}
        </div>

        {/* Auto-save indicator */}
        <p className="text-center text-xs text-[#2B2725]/50 mt-4">
          {isSaving ? 'Saving...' : 'Your progress is automatically saved'}
        </p>
      </div>
    </div>
  );
}