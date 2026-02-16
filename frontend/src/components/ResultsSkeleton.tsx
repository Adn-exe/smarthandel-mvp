

export function ResultsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
                <div className="h-8 w-48 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-10 w-96 bg-gray-200 rounded-lg mx-auto"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                {/* Single Store Card Skeleton */}
                <div className="p-6 rounded-2xl border border-gray-100 bg-white h-[400px]">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="h-4 w-48 bg-gray-100 rounded"></div>
                        </div>
                        <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-12 w-12 bg-gray-100 rounded"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Multi Store Card Skeleton */}
                <div className="p-6 rounded-2xl border border-gray-100 bg-white h-[400px]">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="h-4 w-48 bg-gray-100 rounded"></div>
                        </div>
                        <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-12 w-12 bg-gray-100 rounded"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
