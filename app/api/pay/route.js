import pool from "@/lib/db";

function computeHours(entryTime, endTime) {
    const entry = new Date(entryTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - entry.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(diffHours)); // minimal 1 jam
}

function computeTotalPrice(hours) {
    let totalPrice = 5000;
    if (hours > 1) totalPrice += (hours - 1) * 3000;
    return totalPrice;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { ticket_code } = body;

        if (!ticket_code) {
            return Response.json(
                { success: false, message: "ticket_code is required" },
                { status: 400 }
            );
        }

        const result = await pool.query(
            `
      SELECT id, ticket_code, entry_time, exit_time, total_price
      FROM public.tickets
      WHERE ticket_code = $1
      LIMIT 1
      `,
            [ticket_code]
        );

        if (result.rowCount === 0) {
            return Response.json(
                { success: false, message: "Ticket not found" },
                { status: 404 }
            );
        }

        const ticket = result.rows[0];

        // Idempotency: if already paid/processed, do not mutate again.
        if (ticket.exit_time && ticket.total_price != null) {
            const hours = computeHours(ticket.entry_time, ticket.exit_time);
            return Response.json(
                {
                    success: true,
                    data: {
                        ticket_id: ticket.id,
                        ticket_code: ticket.ticket_code,
                        entry_time: ticket.entry_time,
                        exit_time: ticket.exit_time,
                        hours,
                        total_price: ticket.total_price,
                        already_paid: true,
                    },
                },
                { status: 200 }
            );
        }

        const now = new Date();
        const hours = computeHours(ticket.entry_time, now);

        const totalPrice = computeTotalPrice(hours);

        const updateResult = await pool.query(
            `
        UPDATE public.tickets
        SET exit_time = NOW(),
            total_price = $2
        WHERE id = $1
        RETURNING id, ticket_code, entry_time, exit_time, total_price
        `,
            [ticket.id, totalPrice]
        );
        const updated = updateResult.rows[0];

        return Response.json(
            {
                success: true,
                data: {
                    ticket_id: updated.id,
                    ticket_code: updated.ticket_code,
                    entry_time: updated.entry_time,
                    exit_time: updated.exit_time,
                    hours,
                    total_price: updated.total_price,
                    already_paid: false,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        return Response.json(
            { success: false, message: "Failed to calculate price" },
            { status: 500 }
        );
    }
}