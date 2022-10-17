import React, { useState, Fragment } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ErrorMessage } from "@hookform/error-message";
import { Dialog, Transition } from "@headlessui/react";
import CurrencyFormat from "react-currency-format";

type FormValues = {
  salary: number;
  employmentType: string;
};

const schema = yup
  .object({
    employmentType: yup.string().required("Field is required"),
    salary: yup
      .number()
      .typeError("Must be a number")
      .transform((value) => (isNaN(value) ? 0 : value))
      .positive("Must be a more than zero")
      .required("Field is required"),
  })
  .required();

function App() {
  let [isOpen, setIsOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [results, setResults] = useState<any>(null);

  const taxLimit1 = 25000;
  const taxLimit2 = 50000;
  const taxLimit3 = 0;

  const taxRate1 = 0;
  const taxRate2 = 0.125;
  const taxRate3 = 0.285;

  const taxLimits = [
    [taxLimit1, taxRate1],
    [taxLimit2, taxRate2],
    [taxLimit3, taxRate3],
  ];

  const calculatePAYE = (data: any) => {
    let annualGrossSalary = Number(data.salary);
    let taxableSalary = Number(data.salary);
    const NIStaxRate = data.employmentType === "employed" ? 0.111 : 0.171;

    const taxDeductions = [];

    for (var i = 0; i < taxLimits.length; i++) {
      const taxRate = taxLimits[i][1];
      const taxLimit = taxLimits[i][0];
      const deduction =
        taxRate *
        (taxableSalary > taxLimit
          ? i === taxLimits.length - 1
            ? taxableSalary
            : taxLimit
          : taxableSalary > 0
          ? taxableSalary
          : 0);
      taxableSalary -= taxLimit;

      taxDeductions.push(deduction);
    }
    const totalDeduction = taxDeductions.reduce((a: any, b: any) => a + b, 0);
    const PAYEpayment = totalDeduction / 12;

    const NISpayment =
      Number(annualGrossSalary) / 12 > 4880
        ? NIStaxRate * 4880
        : NIStaxRate * (Number(annualGrossSalary) / 12);

    const results: any = {
      taxableAmounts: taxDeductions,
      annualPaye: totalDeduction,
      monthlyPaye: PAYEpayment,
      monthlyNIS: NISpayment,
      salary: Number(annualGrossSalary),
      type: data.employmentType,
      dateCreated: new Date(),
    };

    setResults((prev: any) => (prev ? [...prev, results] : [results]));
  };

  const formatCurrency = (amount: number) =>
    amount > 0
      ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : "";

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // console.log(data);
    // const salary = Number(data.salary);
    calculatePAYE(data);
    reset();
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="space-y-6 container grid place-items-center xl:max-w-7xl mx-auto px-4 py-16 lg:px-8 lg:py-32">
          <div className="text-center">
            <p className="text-center font-medium text-blue-500 mb-1 mx-auto">
              This calculator is provided free-of-cost for educational purposes
              only
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Barbados Salary Tax Calculator
            </h2>
            <h3 className="text-lg md:text-xl md:leading-relaxed font-medium text-gray-400 lg:w-2/3 mx-auto">
              This simple calculator will help you estimate your monthly tax
              obligations
            </h3>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full md:w-1/2 flex flex-col md:flex-row items-start gap-4"
          >
            <label className="w-full flex-1">
              <span className="text-sm font-medium text-gray-600">
                Annual Gross Salary
              </span>
              <Controller
                control={control}
                name="salary"
                render={({ field: { onChange, value } }) => (
                  <CurrencyFormat
                    thousandSeparator={true}
                    prefix={"$"}
                    placeholder="0.00"
                    className="block border border-gray-200 rounded px-3 py-2 leading-6 w-full focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    value={isNaN(value) ? "" : Number(value)}
                    onValueChange={(val: any) => {
                      const { floatValue } = val;
                      onChange(Number(floatValue));
                    }}
                  />
                )}
              />
              <ErrorMessage
                errors={errors}
                name="salary"
                render={({ message }) => (
                  <p className="text-sm text-red-500">{message}</p>
                )}
              />
            </label>
            <label className="w-full flex-1">
              <span className="text-sm font-medium text-gray-600">
                Employment Status
              </span>
              <select
                {...register("employmentType")}
                className="block border border-gray-200 rounded px-3 py-2 leading-6 w-full focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              >
                <option value="">Select...</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
              </select>
              <ErrorMessage
                errors={errors}
                name="employmentType"
                render={({ message }) => (
                  <p className="text-sm text-red-500">{message}</p>
                )}
              />
            </label>

            <button
              type="submit"
              className="py-2 px-4 self-center bg-blue-600 text-white font-medium hover:bg-blue-800"
            >
              Calculate
            </button>
          </form>
          <p className="text-center font-medium text-red-400 text-xs">
            <sup className="mr-1">*</sup>This calculator does not currently
            account for any taxable benefits. Please consult a tax professional
            for accurate assessments
          </p>
          {results?.length > 0 && (
            <p className="text-center font-medium text-gray-400 lg:w-2/3 mx-auto">
              Your previous assessments are listed below
            </p>
          )}
          {results
            ?.sort((a: any, b: any) => b.dateCreated - a.dateCreated)
            .map((result: any, index: number) => {
              const totalMonthlyTax =
                Number(result.monthlyNIS) + Number(result.monthlyPaye);

              const remainder = Number(result.salary) / 12 - totalMonthlyTax;
              return (
                <div
                  key={index}
                  className="text-gray-500 rounded-md bg-white shadow-lg p-3 w-full md:w-2/3"
                >
                  <p className="md:text-sm py-3 text-center font-medium border-b border-gray-200 mb-3">
                    For a monthly gross salary of{" "}
                    <span className="text-blue-500 text-xl">
                      {formatCurrency(Number(result.salary) / 12)} (
                      {result.type})
                    </span>
                    , you will pay the following on a{" "}
                    <span className="text-blue-500 text-xl">monthly</span>{" "}
                    basis:
                  </p>
                  <details>
                    <summary className=" group-open:text-green-500 list-none">
                      <div className="flex items-center justify-between hover:bg-blue-100 p-2">
                        <div>
                          PAYE{" "}
                          <span className="text-blue-400 text-sm group-open:hidden mr-4 cursor-pointer">
                            Show calculations
                          </span>
                          <span className="text-blue-400 text-sm hidden group-open:inline mr-4 cursor-pointer">
                            Hide calculations
                          </span>
                        </div>
                        <div>{formatCurrency(result.monthlyPaye)}</div>
                      </div>
                    </summary>
                    <div className="mx-6">
                      <p className="text-sm text-gray-400">
                        Below is a summary of the calculating of the monthly
                        PAYE obligations
                      </p>
                      <table className="my-3 p-6 text-sm table-auto w-full bg-gray-100 border border-gray-200">
                        <thead className="bg-gray-300 text-gray-600 divide-y divide-gray-200 border border-gray-200">
                          <tr className="divide-x divide-gray-200">
                            <td>Limit</td>
                            <td>Tax Rate</td>
                            <td>Taxable Amount</td>
                            <td>Amount</td>
                          </tr>
                        </thead>
                        <tbody className="border-t border-gray-200 divide-y divide-gray-200">
                          {taxLimits.map((limit: any, index: number) => (
                            <tr
                              className="divide-x divide-gray-200"
                              key={index}
                            >
                              <td>{formatCurrency(limit[0])}</td>
                              <td>{(limit[1] * 100).toFixed(2)} %</td>
                              <td></td>
                              <td>
                                {formatCurrency(result.taxableAmounts[index])}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} className="text-right px-3">
                              Total Annual Tax
                            </td>
                            <td>
                              {formatCurrency(
                                result.taxableAmounts.reduce(
                                  (a: number, b: number) => a + b,
                                  0
                                )
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="text-right px-3">
                              Total Monthly Tax
                            </td>
                            <td>
                              {formatCurrency(
                                result.taxableAmounts.reduce(
                                  (a: number, b: number) => a + b,
                                  0
                                ) / 12
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </details>

                  <div className="flex items-center justify-between hover:bg-blue-100 p-2">
                    <div>NIS</div>
                    <div>{formatCurrency(result.monthlyNIS)}</div>
                  </div>
                  <div className="flex items-center justify-between hover:bg-blue-100 p-2">
                    <div>Total Tax</div>
                    <div>{formatCurrency(totalMonthlyTax)}</div>
                  </div>
                  <div className="flex items-center justify-between hover:bg-blue-100 p-2">
                    <div>Remaining</div>
                    <div>{formatCurrency(remainder)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          <Transition.Child
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
            as={Fragment}
          >
            {/* The backdrop, rendered as a fixed sibling to the panel container */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
            as={Fragment}
          >
            {/* Full-screen container to center the panel */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white">
                <Dialog.Title className="p-3 border-b border-gray-200 font-medium text-lg">
                  Privacy Policy
                </Dialog.Title>
                <Dialog.Description className="p-3 text-gray-600 text-center">
                  We do not collect any data from this website. All calculations
                  are done on your device and no data is sent to any server.
                </Dialog.Description>
                <div className="my-4 flex justify-center">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={() => setIsOpen(false)}
                  >
                    I understand
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition>
      <div className="flex items-center justify-between border-t border-gray-200 p-3">
        <p className="text-sm text-center text-gray-600">
          &copy; {new Date().getFullYear()} for fun by{" "}
          <a href="https://shannonclarke.com" target="_blank" rel="noreferrer">
            Shannon Clarke
          </a>
        </p>
        <button
          className="text-center font-medium text-blue-600 hover:bg-blue-200 rounded px-2 py-1"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          Privacy Policy
        </button>
      </div>
    </div>
  );
}

export default App;
