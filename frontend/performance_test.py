#!/usr/bin/env python3
"""
Performance Testing Script for Kiaan WMS Platform
Tests: Response times, asset loading, API response sizes, concurrent requests
"""

import requests
import time
import statistics
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import urllib3

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://wms.alexandratechlab.com"
NUM_REQUESTS = 10

class PerformanceTest:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': BASE_URL,
            'response_time_tests': {},
            'asset_loading': {},
            'api_response_sizes': {},
            'concurrent_tests': {}
        }

    def test_endpoint_response_time(self, endpoint, num_requests=NUM_REQUESTS):
        """Test response times for a specific endpoint"""
        print(f"\n{'='*60}")
        print(f"Testing: {endpoint}")
        print(f"{'='*60}")

        response_times = []
        successful_requests = 0
        failed_requests = 0
        status_codes = []

        for i in range(num_requests):
            try:
                start_time = time.time()
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    verify=False,
                    timeout=30,
                    allow_redirects=True
                )
                end_time = time.time()

                response_time = (end_time - start_time) * 1000  # Convert to ms
                response_times.append(response_time)
                status_codes.append(response.status_code)

                if response.status_code < 400:
                    successful_requests += 1
                else:
                    failed_requests += 1

                print(f"Request {i+1}/{num_requests}: {response_time:.2f}ms - Status: {response.status_code}")

                # Small delay between requests
                time.sleep(0.1)

            except Exception as e:
                failed_requests += 1
                print(f"Request {i+1}/{num_requests}: FAILED - {str(e)}")

        # Calculate statistics
        if response_times:
            stats = {
                'endpoint': endpoint,
                'total_requests': num_requests,
                'successful': successful_requests,
                'failed': failed_requests,
                'min_ms': round(min(response_times), 2),
                'max_ms': round(max(response_times), 2),
                'avg_ms': round(statistics.mean(response_times), 2),
                'median_ms': round(statistics.median(response_times), 2),
                'status_codes': status_codes
            }

            if len(response_times) > 1:
                stats['std_dev_ms'] = round(statistics.stdev(response_times), 2)

            print(f"\nResults for {endpoint}:")
            print(f"  Min: {stats['min_ms']}ms")
            print(f"  Max: {stats['max_ms']}ms")
            print(f"  Average: {stats['avg_ms']}ms")
            print(f"  Median: {stats['median_ms']}ms")
            if 'std_dev_ms' in stats:
                print(f"  Std Dev: {stats['std_dev_ms']}ms")
            print(f"  Success Rate: {successful_requests}/{num_requests}")

            return stats
        else:
            return {
                'endpoint': endpoint,
                'total_requests': num_requests,
                'successful': 0,
                'failed': failed_requests,
                'error': 'All requests failed'
            }

    def test_asset_loading(self):
        """Test static asset loading and caching headers"""
        print(f"\n{'='*60}")
        print("Testing Asset Loading & Caching Headers")
        print(f"{'='*60}")

        # Common asset paths to test
        asset_paths = [
            '/',
            '/static/css/main.css',
            '/static/js/main.js',
            '/favicon.ico',
            '/logo.png',
            '/assets/index.js',
            '/assets/index.css'
        ]

        asset_results = []

        for path in asset_paths:
            try:
                start_time = time.time()
                response = requests.get(
                    f"{BASE_URL}{path}",
                    verify=False,
                    timeout=10,
                    allow_redirects=True
                )
                end_time = time.time()

                response_time = (end_time - start_time) * 1000

                asset_info = {
                    'path': path,
                    'status_code': response.status_code,
                    'response_time_ms': round(response_time, 2),
                    'size_bytes': len(response.content),
                    'size_kb': round(len(response.content) / 1024, 2),
                    'content_type': response.headers.get('Content-Type', 'N/A'),
                    'cache_control': response.headers.get('Cache-Control', 'Not Set'),
                    'etag': response.headers.get('ETag', 'Not Set'),
                    'last_modified': response.headers.get('Last-Modified', 'Not Set'),
                    'server': response.headers.get('Server', 'N/A')
                }

                asset_results.append(asset_info)

                print(f"\n{path}:")
                print(f"  Status: {asset_info['status_code']}")
                print(f"  Size: {asset_info['size_kb']} KB")
                print(f"  Response Time: {asset_info['response_time_ms']}ms")
                print(f"  Content-Type: {asset_info['content_type']}")
                print(f"  Cache-Control: {asset_info['cache_control']}")
                print(f"  ETag: {asset_info['etag']}")

            except Exception as e:
                asset_results.append({
                    'path': path,
                    'error': str(e)
                })
                print(f"\n{path}: FAILED - {str(e)}")

        return asset_results

    def test_api_response_sizes(self):
        """Test API endpoint response sizes"""
        print(f"\n{'='*60}")
        print("Testing API Response Sizes")
        print(f"{'='*60}")

        # Common API endpoints
        api_endpoints = [
            '/api/health',
            '/api/v1/health',
            '/api/auth/login',
            '/api/products',
            '/api/inventory',
            '/api/orders',
            '/api/users'
        ]

        api_results = []

        for endpoint in api_endpoints:
            try:
                start_time = time.time()
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    verify=False,
                    timeout=10,
                    allow_redirects=True
                )
                end_time = time.time()

                response_time = (end_time - start_time) * 1000

                api_info = {
                    'endpoint': endpoint,
                    'status_code': response.status_code,
                    'response_time_ms': round(response_time, 2),
                    'size_bytes': len(response.content),
                    'size_kb': round(len(response.content) / 1024, 2),
                    'content_type': response.headers.get('Content-Type', 'N/A'),
                    'content_encoding': response.headers.get('Content-Encoding', 'None'),
                }

                # Try to parse JSON response
                try:
                    json_data = response.json()
                    api_info['is_json'] = True
                    api_info['json_keys'] = list(json_data.keys()) if isinstance(json_data, dict) else 'Array response'
                except:
                    api_info['is_json'] = False

                api_results.append(api_info)

                print(f"\n{endpoint}:")
                print(f"  Status: {api_info['status_code']}")
                print(f"  Size: {api_info['size_kb']} KB ({api_info['size_bytes']} bytes)")
                print(f"  Response Time: {api_info['response_time_ms']}ms")
                print(f"  Content-Type: {api_info['content_type']}")
                print(f"  Is JSON: {api_info['is_json']}")
                if api_info['is_json']:
                    print(f"  JSON Keys: {api_info.get('json_keys', 'N/A')}")

            except Exception as e:
                api_results.append({
                    'endpoint': endpoint,
                    'error': str(e)
                })
                print(f"\n{endpoint}: FAILED - {str(e)}")

        return api_results

    def test_concurrent_requests(self, endpoint='/', num_concurrent=5, num_rounds=3):
        """Test concurrent request handling"""
        print(f"\n{'='*60}")
        print(f"Testing Concurrent Requests ({num_concurrent} concurrent, {num_rounds} rounds)")
        print(f"{'='*60}")

        def make_request(request_id):
            try:
                start_time = time.time()
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    verify=False,
                    timeout=30,
                    allow_redirects=True
                )
                end_time = time.time()

                return {
                    'request_id': request_id,
                    'success': True,
                    'status_code': response.status_code,
                    'response_time_ms': (end_time - start_time) * 1000
                }
            except Exception as e:
                return {
                    'request_id': request_id,
                    'success': False,
                    'error': str(e)
                }

        all_results = []

        for round_num in range(num_rounds):
            print(f"\nRound {round_num + 1}/{num_rounds}:")
            round_start = time.time()

            with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
                futures = [executor.submit(make_request, i) for i in range(num_concurrent)]
                round_results = []

                for future in as_completed(futures):
                    result = future.result()
                    round_results.append(result)
                    if result['success']:
                        print(f"  Request {result['request_id']}: {result['response_time_ms']:.2f}ms - Status: {result['status_code']}")
                    else:
                        print(f"  Request {result['request_id']}: FAILED - {result['error']}")

            round_end = time.time()
            round_duration = (round_end - round_start) * 1000

            print(f"  Total round time: {round_duration:.2f}ms")

            all_results.extend(round_results)

            # Delay between rounds
            if round_num < num_rounds - 1:
                time.sleep(0.5)

        # Calculate statistics
        successful = [r for r in all_results if r['success']]
        failed = [r for r in all_results if not r['success']]

        if successful:
            response_times = [r['response_time_ms'] for r in successful]
            stats = {
                'endpoint': endpoint,
                'total_requests': len(all_results),
                'successful': len(successful),
                'failed': len(failed),
                'concurrent_level': num_concurrent,
                'rounds': num_rounds,
                'min_ms': round(min(response_times), 2),
                'max_ms': round(max(response_times), 2),
                'avg_ms': round(statistics.mean(response_times), 2),
                'median_ms': round(statistics.median(response_times), 2)
            }

            if len(response_times) > 1:
                stats['std_dev_ms'] = round(statistics.stdev(response_times), 2)

            print(f"\nConcurrent Test Summary:")
            print(f"  Total Requests: {stats['total_requests']}")
            print(f"  Successful: {stats['successful']}")
            print(f"  Failed: {stats['failed']}")
            print(f"  Min Response Time: {stats['min_ms']}ms")
            print(f"  Max Response Time: {stats['max_ms']}ms")
            print(f"  Avg Response Time: {stats['avg_ms']}ms")

            return stats
        else:
            return {
                'endpoint': endpoint,
                'total_requests': len(all_results),
                'successful': 0,
                'failed': len(failed),
                'error': 'All concurrent requests failed'
            }

    def run_all_tests(self):
        """Run all performance tests"""
        print("\n" + "="*60)
        print("KIAAN WMS PERFORMANCE TEST SUITE")
        print(f"Target: {BASE_URL}")
        print(f"Started: {self.results['timestamp']}")
        print("="*60)

        # 1. Response Time Testing
        print("\n\n### PHASE 1: Response Time Testing ###")
        self.results['response_time_tests']['homepage'] = self.test_endpoint_response_time('/')
        self.results['response_time_tests']['api_health'] = self.test_endpoint_response_time('/api/health')

        # 2. Asset Loading
        print("\n\n### PHASE 2: Asset Loading & Caching ###")
        self.results['asset_loading'] = self.test_asset_loading()

        # 3. API Response Sizes
        print("\n\n### PHASE 3: API Response Sizes ###")
        self.results['api_response_sizes'] = self.test_api_response_sizes()

        # 4. Concurrent Request Testing
        print("\n\n### PHASE 4: Concurrent Request Testing ###")
        self.results['concurrent_tests'] = self.test_concurrent_requests('/', num_concurrent=5, num_rounds=3)

        # Save results to JSON
        output_file = '/root/kiaan-wms-frontend/frontend/performance_test_results.json'
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        print(f"\n\n{'='*60}")
        print(f"Performance test completed!")
        print(f"Results saved to: {output_file}")
        print(f"{'='*60}")

        return self.results

if __name__ == '__main__':
    tester = PerformanceTest()
    tester.run_all_tests()
