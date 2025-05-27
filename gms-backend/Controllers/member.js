const Member = require('../Modals/member');
const Membership = require('../Modals/membership');

// Fetch all members
exports.getAllMembers = async (req, res) => {
    try {
        const { skip = 0, limit = 10 } = req.query;
        const members = await Member.find({ gym: req.gym._id }).skip(parseInt(skip)).limit(parseInt(limit));
        const totalMembers = await Member.countDocuments({ gym: req.gym._id });

        res.status(200).json({
            message: 'Members fetched successfully',
            members,
            totalMembers
        });
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Function to add months to a date
function addMonthsToDate(joiningDate, months) {
    let today = new Date(joiningDate);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const futureMonth = currentMonth + months;
    const futureYear = currentYear + Math.floor(futureMonth / 12);
    const adjustedMonth = futureMonth % 12;
    const futureDate = new Date(futureYear, adjustedMonth, currentDay);
    const lastDayofFutureMonth = new Date(futureYear, adjustedMonth + 1, 0).getDate();
    const adjustedDay = Math.min(currentDay, lastDayofFutureMonth);
    futureDate.setDate(adjustedDay);
    return futureDate;
}

// Register a new member

const mongoose = require('mongoose');

exports.registerMember = async (req, res) => {
    try {
        const { name, mobNo, address, profilePic, membership, joiningDate } = req.body;

        // Log incoming request details
        console.log("Request Body:", req.body);
        console.log("Gym ID from request:", req.gym._id);

        // Check if the member already exists
        const member = await Member.findOne({ gym: req.gym._id, mobNo });
        if (member) {
            return res.status(400).json({ error: 'Member already exists with this mobile number' });
        }

        // Validate membership ID
        if (!mongoose.Types.ObjectId.isValid(membership)) {
            return res.status(400).json({ error: 'Invalid membership ID' });
        }

        const membershipId = new mongoose.Types.ObjectId(membership);

        // Log the membership ID being checked
        console.log("Membership ID being checked:", membershipId);

        // Check for the membership
        const memberShip = await Membership.findOne({ _id: membershipId, gym: req.gym._id });
        if (!memberShip) {
            console.log("Membership not found for ID:", membershipId);
            return res.status(400).json({ error: 'Membership not found' });
        }

        // Validate joining date
        const jngDate = new Date(joiningDate);
        if (isNaN(jngDate)) {
            return res.status(400).json({ error: 'Invalid joining date' });
        }

        const memberShipMonth = memberShip.months;
        const nextBillDate = addMonthsToDate(jngDate, memberShipMonth);

        let newMember = new Member({
            name,
            mobNo,
            address,
            profilePic,
            membership: membershipId,
            gym: req.gym._id,
            nextBillDate
        });

        await newMember.save();
        res.status(200).json({ message: 'Member added successfully', newMember });
    } catch (error) {
        console.error("Error registering member:", error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}
// Search for a member
exports.searchMember = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        const members = await Member.find({
            gym: req.gym._id,
            $or: [
                { name: { $regex: '^' + searchTerm, $options: 'i' } },
                { mobNo: { $regex: '^' + searchTerm, $options: 'i' } }
            ]
        });
        res.status(200).json({
            message: members.length ? "Members fetched successfully" : "No such member registered yet",
            members,
            totalMembers: members.length
        });
    } catch (error) {
        console.error("Error searching members:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Fetch monthly members
exports.monthlyMember = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const members = await Member.find({
            gym: req.gym._id,
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: members.length ? "Members fetched successfully" : "No such member registered yet",
            members,
            totalMembers: members.length
        });
    } catch (error) {
        console.error("Error fetching monthly members:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Fetch members expiring within 3 days
exports.expiryWithin3Days = async (req, res) => {
    try {
        const today = new Date();
        const nextThreeDays = new Date();
        nextThreeDays.setDate(today.getDate() + 3);

        const members = await Member.find({
            gym: req.gym._id,
            nextBillDate: {
                $gte: today,
                $lte: nextThreeDays
            }
        });

        res.status(200).json({
            message: members.length ? "Members fetched successfully" : "No such member expiring within three days",
            members,
            totalMembers: members.length
        });
    } catch (error) {
        console.error("Error fetching members expiring within 3 days:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Fetch members expiring within 4 to 7 days
exports.expiryWithin4To7Days = async (req, res) => {
    try {
        const today = new Date();
        const next4Days = new Date();
        next4Days.setDate(today.getDate() + 4);

        const next7Days = new Date();
        next7Days.setDate(today.getDate() + 7);

        const members = await Member.find({
            gym: req.gym._id,
            nextBillDate: {
                $gte: next4Days,
                $lte: next7Days
            }
        });

        res.status(200).json({
            message: members.length ? "Members fetched successfully" : "No such member expiring within 4 to 7 days",
            members,
            totalMembers: members.length
        });
    } catch (error) {
        console.error("Error fetching members expiring within 4 to 7 days:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Fetch expired members
exports.expiredMember = async (req, res) => {
    try {
        const today = new Date();
        const members = await Member.find({
            gym: req.gym._id,
            status: "Active",
            nextBillDate: { $lt: today }
        });

        res.status(200).json({
            message: members.length ? "Members fetched successfully" : "No such member expired",
            members,
            totalMembers: members.length
        });
    } catch (error) {
        console.error("Error fetching expired members:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Fetch inactive members
exports.inActiveMember = async (req, res) => {
    try {
        const members = await Member.find({
            gym: req.gym._id,
            status: "Pending"
        });

        res.status(200).json({
            message: members.length ? "Members fetched successfully" : "No such member expired",
            members,
            totalMembers: members.length
        });
    } catch (error) {
        console.error("Error fetching inactive members:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Get member details
exports.getMemberDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await Member.findOne({ _id: id, gym: req.gym._id });
        if (!member) {
            return res.status(404).json({ error: "No such member" });
        }
        res.status(200).json({
            message: "Member data fetched successfully",
            member
        });
    } catch (error) {
        console.error("Error fetching member details:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Change member status
exports.changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const member = await Member.findOne({ _id: id, gym: req.gym._id });
        if (!member) {
            return res.status(404).json({ error: "No such member" });
        }
        member.status = status;
        await member.save();
        res.status(200).json({
            message: "Status changed successfully",
            member
        });
    } catch (error) {
        console.error("Error changing member status:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

// Update member plan
exports.updateMemberPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { membership } = req.body;
        const member = await Member.findOne({ _id: id, gym: req.gym._id });
        if (!member) {
            return res.status(404).json({ error: "No such member exists" });
        }
        const memberShip = await Membership.findOne({ gym: req.gym._id, _id: membership });
        if (!memberShip) {
            return res.status(400).json({ error: 'Membership not found' });
        }
        const memberShipMonth = memberShip.months;
        const nextBillDate = addMonthsToDate(member.joiningDate, memberShipMonth); // Use the member's joiningDate
        member.membership = membership;
        member.nextBillDate = nextBillDate;
        await member.save();
        res.status(200).json({
            message: "Member plan updated successfully",
            member
        });
    } catch (error) {
        console.error("Error updating member plan:", error);
        res.status(500).json({ error: 'Server error' });
    }
}