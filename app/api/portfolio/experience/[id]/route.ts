import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { callRevalidate } from '@/lib/revalidate';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  companyUrl?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// GET single experience
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const experienceId = id;
    
    const portfolioRef = adminDb.collection('portfolio').doc('data');
    const doc = await portfolioRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Experience not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const experiences = data?.experience || [];
    const experience = experiences.find((exp: Experience) => exp.id === experienceId);

    if (!experience) {
      return NextResponse.json(
        { success: false, error: 'Experience not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: experience
    });
  } catch (error) {
    console.error('Error fetching experience:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch experience' },
      { status: 500 }
    );
  }
}

// UPDATE experience
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const experienceId = id;
    const experienceData = await request.json();

    // Validation
    if (!experienceData.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Job title is required' },
        { status: 400 }
      );
    }

    if (!experienceData.company?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 }
      );
    }

    if (!experienceData.startDate) {
      return NextResponse.json(
        { success: false, error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Get current portfolio data
    const portfolioRef = adminDb.collection('portfolio').doc('data');
    const doc = await portfolioRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Experience not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const experiences = data?.experience || [];
    const experienceIndex = experiences.findIndex((exp: Experience) => exp.id === experienceId);

    if (experienceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Experience not found' },
        { status: 404 }
      );
    }

    // Prepare updated experience object
    const updatedExperience: any = {
      ...experiences[experienceIndex],
      title: experienceData.title.trim(),
      company: experienceData.company.trim(),
      location: experienceData.location?.trim() || '',
      startDate: experienceData.startDate,
      current: Boolean(experienceData.current),
      description: experienceData.description?.trim() || '',
      responsibilities: Array.isArray(experienceData.responsibilities) 
        ? experienceData.responsibilities.filter((item: string) => item.trim()) 
        : [],
      achievements: Array.isArray(experienceData.achievements) 
        ? experienceData.achievements.filter((item: string) => item.trim()) 
        : [],
      technologies: Array.isArray(experienceData.technologies) 
        ? experienceData.technologies.filter((item: string) => item.trim()) 
        : [],
      order: Number(experienceData.order) || 0,
      updatedAt: new Date().toISOString()
    };

    // Add endDate only if not current job and endDate exists
    if (!experienceData.current && experienceData.endDate) {
      updatedExperience.endDate = experienceData.endDate;
    }

    // Add companyUrl only if it exists
    if (experienceData.companyUrl?.trim()) {
      updatedExperience.companyUrl = experienceData.companyUrl.trim();
    }

    // Update the experience in the array
    const updatedExperiences = [...experiences];
    updatedExperiences[experienceIndex] = updatedExperience;

    // Update the document
    await portfolioRef.set({
      ...data,
      experience: updatedExperiences,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Trigger on-demand revalidation for pages that depend on portfolio data
    await callRevalidate(['/', '/about']);

    return NextResponse.json({
      success: true,
      data: updatedExperience
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update experience' },
      { status: 500 }
    );
  }
}

// DELETE experience
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const experienceId = id;
    
    // Get current portfolio data
    const portfolioRef = adminDb.collection('portfolio').doc('data');
    const doc = await portfolioRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Experience not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const experiences = data?.experience || [];
    const experienceIndex = experiences.findIndex((exp: Experience) => exp.id === experienceId);

    if (experienceIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Experience not found' },
        { status: 404 }
      );
    }

    // Remove the experience from the array
    const updatedExperiences = experiences.filter((exp: Experience) => exp.id !== experienceId);

    // Update the document
    await portfolioRef.set({
      ...data,
      experience: updatedExperiences,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Trigger on-demand revalidation for pages that depend on portfolio data
    await callRevalidate(['/', '/about']);

    return NextResponse.json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete experience' },
      { status: 500 }
    );
  }
}
