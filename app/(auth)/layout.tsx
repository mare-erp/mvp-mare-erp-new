import { ShipWheel } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <ShipWheel className="mx-auto h-10 w-10 text-blue-600" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                        Maré ERP
                    </h1>
                </div>
                {children}
            </div>
        </main>
    );
}

