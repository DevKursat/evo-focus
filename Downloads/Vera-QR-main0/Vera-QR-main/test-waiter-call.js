// Test waiter call API directly
const testWaiterCall = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/waiter-calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                organization_id: '20000000-0000-0000-0000-000000000001',
                qr_code_id: '244eebbc-50ac-406a-a027-e4109070f119',
                customer_name: 'Test User',
                call_type: 'service',
            }),
        })

        const result = await response.json()
        console.log('Status:', response.status)
        console.log('Response:', JSON.stringify(result, null, 2))

        if (!response.ok) {
            console.error('ERROR:', result)
        }
    } catch (error) {
        console.error('Network error:', error)
    }
}

testWaiterCall()
