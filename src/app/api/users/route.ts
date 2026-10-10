import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: users,
      currentUserId: session.id,
    });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Input data tidak valid';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { username, password, name, email } = parseResult.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username atau email sudah digunakan' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        name: name || username,
        email: email || null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengguna baru berhasil ditambahkan',
      data: newUser,
    });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan pengguna baru' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengguna wajib disertakan' }, { status: 400 });
    }

    if (id === session.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif' },
        { status: 400 }
      );
    }

    const userCount = await prisma.user.count();
    if (userCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghapus pengguna terakhir di dalam sistem' },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil dihapus',
    });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pengguna' },
      { status: 500 }
    );
  }
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(60).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = updateUserSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || 'Input data tidak valid' },
        { status: 400 }
      );
    }

    const { id, name, email, password } = parseResult.data;

    const dataToUpdate: { name?: string; email?: string | null; password?: string } = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email || null;
    if (password) {
      dataToUpdate.password = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui pengguna' },
      { status: 500 }
    );
  }
}
